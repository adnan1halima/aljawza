-- ==========================================================
-- الترحيل رقم 2: نظام النقاط الجديد + حساب المدير الشامل
-- نفّذ هذا الملف من SQL Editor بعد schema.sql (وبعد seed.sql إن استخدمته)
-- ==========================================================

-- ----------------------------------------------------------
-- 1) صلاحية المدير (أ. مالك طرابلسي)
-- ----------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- عدّل البريد التالي إذا استخدمت بريدًا مختلفًا لحساب أ. مالك عند إنشائه
update public.profiles set is_admin = true where email = 'malek@aljawzah.local';

-- ----------------------------------------------------------
-- 2) حقول جديدة في سجل يوم السبت (attendance_records)
-- ----------------------------------------------------------
alter table public.attendance_records
  add column if not exists pages int,
  add column if not exists rating int,
  add column if not exists dress_code int not null default 0,
  add column if not exists manners int not null default 0,
  add column if not exists discipline int not null default 0;

alter table public.attendance_records
  drop constraint if exists check_pages_range;
alter table public.attendance_records
  add constraint check_pages_range check (pages is null or pages between 1 and 5);

alter table public.attendance_records
  drop constraint if exists check_rating_range;
alter table public.attendance_records
  add constraint check_rating_range check (rating is null or rating in (1, 2, 3));

alter table public.attendance_records
  drop constraint if exists check_dress_code_range;
alter table public.attendance_records
  add constraint check_dress_code_range check (dress_code in (0, 1, 2, 3));

alter table public.attendance_records
  drop constraint if exists check_manners_range;
alter table public.attendance_records
  add constraint check_manners_range check (manners in (0, 5));

-- ----------------------------------------------------------
-- 3) دالة حساب نقاط التسميع من (عدد الصفحات × التقييم)
--    الجدول مطابق تمامًا لما طلبه المستخدم (محصور في 1-5 صفحات و1-3 تقييم)
-- ----------------------------------------------------------
create or replace function public.calc_memorization_points(p_pages int, p_rating int)
returns int
language sql
immutable
as $$
  select case
    when p_pages is null or p_rating is null then 0
    when p_pages = 1 and p_rating = 1 then 3
    when p_pages = 1 and p_rating = 2 then 4
    when p_pages = 1 and p_rating = 3 then 5
    when p_pages = 2 and p_rating = 1 then 5
    when p_pages = 2 and p_rating = 2 then 8
    when p_pages = 2 and p_rating = 3 then 11
    when p_pages = 3 and p_rating = 1 then 9
    when p_pages = 3 and p_rating = 2 then 13
    when p_pages = 3 and p_rating = 3 then 17
    when p_pages = 4 and p_rating = 1 then 13
    when p_pages = 4 and p_rating = 2 then 18
    when p_pages = 4 and p_rating = 3 then 23
    when p_pages = 5 and p_rating = 1 then 14
    when p_pages = 5 and p_rating = 2 then 20
    when p_pages = 5 and p_rating = 3 then 26
    else 0
  end;
$$;

-- عمود محسوب تلقائيًا: مجموع نقاط السجل الواحد
-- (نقاط التسميع + اللباس الإسلامي + الالتزام بالأدب + الانضباط)
alter table public.attendance_records
  drop column if exists total_points;
alter table public.attendance_records
  add column total_points int generated always as (
    public.calc_memorization_points(pages, rating) + dress_code + manners + discipline
  ) stored;

-- ----------------------------------------------------------
-- 4) حقول جديدة في جدول الطلاب (students)
-- ----------------------------------------------------------
-- إعادة تسمية العمود القديم ليصبح "النقاط السابقة" (تراكم نقاط كل الأيام)
alter table public.students rename column ranking_score to accumulated_points;

-- النقاط الموزعة: حقل حر يعدّله المعلم يدويًا (بونص/خصم يدوي)
alter table public.students
  add column if not exists distributed_points numeric not null default 0;

-- المجموع الكلي: يُحسب تلقائيًا = النقاط السابقة + النقاط الموزعة
alter table public.students
  drop column if exists grand_total;
alter table public.students
  add column grand_total numeric generated always as (
    accumulated_points + distributed_points
  ) stored;

-- ----------------------------------------------------------
-- 5) تحديث دالة/محفز إعادة حساب نقاط الطالب لتستخدم total_points
-- ----------------------------------------------------------
create or replace function public.recalc_student_ranking()
returns trigger as $$
begin
  update public.students
  set accumulated_points = (
    select coalesce(sum(total_points), 0)
    from public.attendance_records
    where student_id = coalesce(new.student_id, old.student_id)
  )
  where id = coalesce(new.student_id, old.student_id);
  return null;
end;
$$ language plpgsql;
-- (المحفز trg_recalc_ranking من schema.sql يستخدم هذه الدالة تلقائيًا، لا حاجة لإعادة إنشائه)

-- ----------------------------------------------------------
-- 6) تحديث دالة الترتيب على مستوى المسجد لتستخدم grand_total
-- ----------------------------------------------------------
create or replace function public.get_mosque_ranking(p_student_id uuid)
returns int
language sql
security definer
set search_path = public
as $$
  select rank::int from (
    select id, rank() over (order by grand_total desc) as rank
    from public.students
  ) t
  where t.id = p_student_id;
$$;

-- ----------------------------------------------------------
-- 7) صلاحيات المدير: تجاوز كامل لكل الجداول (RLS)
-- ----------------------------------------------------------
create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- profiles: المدير يرى ويعدل كل الملفات
drop policy if exists "المدير يرى كل الملفات" on public.profiles;
create policy "المدير يرى كل الملفات"
  on public.profiles for select
  using (auth.uid() = id or public.is_current_user_admin());

drop policy if exists "المدير يعدل كل الملفات" on public.profiles;
create policy "المدير يعدل كل الملفات"
  on public.profiles for update
  using (auth.uid() = id or public.is_current_user_admin());

-- students: المدير له كل الصلاحيات على كل الطلاب
drop policy if exists "المدير يرى كل الطلاب" on public.students;
create policy "المدير يرى كل الطلاب"
  on public.students for select
  using (auth.uid() = teacher_id or public.is_current_user_admin());

drop policy if exists "المدير يضيف طلابًا لأي معلم" on public.students;
create policy "المدير يضيف طلابًا لأي معلم"
  on public.students for insert
  with check (auth.uid() = teacher_id or public.is_current_user_admin());

drop policy if exists "المدير يعدل كل الطلاب" on public.students;
create policy "المدير يعدل كل الطلاب"
  on public.students for update
  using (auth.uid() = teacher_id or public.is_current_user_admin())
  with check (auth.uid() = teacher_id or public.is_current_user_admin());

drop policy if exists "المدير يحذف كل الطلاب" on public.students;
create policy "المدير يحذف كل الطلاب"
  on public.students for delete
  using (auth.uid() = teacher_id or public.is_current_user_admin());

-- attendance_records: المدير له كل الصلاحيات على كل السجلات
drop policy if exists "المدير يرى كل السجلات" on public.attendance_records;
create policy "المدير يرى كل السجلات"
  on public.attendance_records for select
  using (auth.uid() = teacher_id or public.is_current_user_admin());

drop policy if exists "المدير يضيف سجلات لأي طالب" on public.attendance_records;
create policy "المدير يضيف سجلات لأي طالب"
  on public.attendance_records for insert
  with check (
    public.is_current_user_admin()
    or (
      auth.uid() = teacher_id
      and exists (
        select 1 from public.students s
        where s.id = student_id and s.teacher_id = auth.uid()
      )
    )
  );

drop policy if exists "المدير يعدل كل السجلات" on public.attendance_records;
create policy "المدير يعدل كل السجلات"
  on public.attendance_records for update
  using (auth.uid() = teacher_id or public.is_current_user_admin())
  with check (auth.uid() = teacher_id or public.is_current_user_admin());

drop policy if exists "المدير يحذف كل السجلات" on public.attendance_records;
create policy "المدير يحذف كل السجلات"
  on public.attendance_records for delete
  using (auth.uid() = teacher_id or public.is_current_user_admin());

-- ملاحظة: السياسات القديمة (المعلم يرى/يعدل/يحذف طلابه أو سجلاته فقط) تبقى موجودة
-- ولا تتعارض مع سياسات المدير الجديدة، لأن Postgres يجمع كل سياسات نفس الأمر بـ OR.
