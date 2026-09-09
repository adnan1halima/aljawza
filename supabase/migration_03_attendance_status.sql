-- ==========================================================
-- الترحيل رقم 3: حالة الطالب كل سبت (حضور/غياب/غياب مبرر/تأخر) + نقاطها
-- نفّذ هذا الملف من SQL Editor بعد migration_02_scoring_and_admin.sql
-- ==========================================================

-- ----------------------------------------------------------
-- 1) عمود الحالة الجديد
-- ----------------------------------------------------------
alter table public.attendance_records add column if not exists status text;

-- ترحيل البيانات القديمة (إن وجدت) من is_present إلى الحالة الجديدة
update public.attendance_records
set status = case when is_present then 'حضور' else 'غياب' end
where status is null;

alter table public.attendance_records alter column status set not null;

alter table public.attendance_records drop constraint if exists check_status_values;
alter table public.attendance_records
  add constraint check_status_values
  check (status in ('حضور', 'غياب', 'غياب مبرر', 'تأخر'));

-- ----------------------------------------------------------
-- 2) دالة نقاط الحالة
--    حضور: 3+ / غياب: 5- / غياب مبرر: 0 / تأخر: 2-
-- ----------------------------------------------------------
create or replace function public.calc_status_points(p_status text)
returns int
language sql
immutable
as $$
  select case p_status
    when 'حضور' then 3
    when 'غياب' then -5
    when 'غياب مبرر' then 0
    when 'تأخر' then -2
    else 0
  end;
$$;

-- ----------------------------------------------------------
-- 3) إعادة بناء عمود is_present تلقائيًا من الحالة (للتوافق مع الاستعلامات القديمة)
--    نعتبر "حضور" و"تأخر" حضورًا فعليًا، و"غياب" و"غياب مبرر" غيابًا
-- ----------------------------------------------------------
alter table public.attendance_records drop column if exists is_present;
alter table public.attendance_records
  add column is_present boolean generated always as (
    status in ('حضور', 'تأخر')
  ) stored;

-- ----------------------------------------------------------
-- 4) إعادة بناء عمود total_points ليشمل نقاط الحالة
--    نقاط التسميع/اللباس/الأدب/الانضباط تُحتسب فقط إذا كانت الحالة حضور أو تأخر
-- ----------------------------------------------------------
alter table public.attendance_records drop column if exists total_points;
alter table public.attendance_records
  add column total_points int generated always as (
    public.calc_status_points(status)
    + case
        when status in ('حضور', 'تأخر')
        then public.calc_memorization_points(pages, rating) + dress_code + manners + discipline
        else 0
      end
  ) stored;

-- ملاحظة: المحفز trg_recalc_ranking (من schema.sql) يعيد احتساب accumulated_points
-- تلقائيًا من مجموع total_points في كل مرة يُضاف أو يُعدّل أو يُحذف فيها سجل، بدون أي تعديل إضافي.
