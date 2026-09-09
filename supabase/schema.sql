-- ==========================================================
-- مسجد الجوزة - نظام المعلمين
-- ملف إنشاء الجداول والصلاحيات (Row Level Security)
-- نفّذ هذا الملف كاملًا من: Supabase Dashboard > SQL Editor
-- ==========================================================

-- 1) جدول ملفات المعلمين (يرتبط بجدول auth.users الخاص بـ Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) جدول الطلاب
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  phone text,
  housing text,
  previous_memorization text,
  notes text,
  -- حقول قابلة للتطوير لاحقًا لطريقة حساب الترتيب
  ranking_score numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_students_teacher_id on public.students (teacher_id);

-- 3) جدول سجلات يوم السبت (الحضور والتسميع والسلوك)
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  is_present boolean not null default true,
  surah text,
  from_ayah int,
  to_ayah int,
  memorization_amount numeric not null default 0, -- بالصفحات (رقم عشري مسموح)
  recitation_type text check (recitation_type in ('جديد', 'مراجعة')),
  evaluation text,
  behavior text check (
    behavior in ('ممتاز', 'جيد جدًا', 'جيد', 'يحتاج متابعة', 'يحتاج تحسين')
  ),
  notes text,
  created_at timestamptz not null default now(),

  -- منع تكرار سجل الطالب في نفس التاريخ
  constraint unique_student_date unique (student_id, date),
  -- الدوام يوم السبت فقط (6 = Saturday عندما تبدأ الأسبوع من الأحد = 0)
  constraint saturday_only check (extract(dow from date) = 6)
);

create index if not exists idx_records_student_id on public.attendance_records (student_id);
create index if not exists idx_records_teacher_id on public.attendance_records (teacher_id);

-- ==========================================================
-- دالة وMحفز لتحديث updated_at تلقائيًا عند تعديل الطالب
-- ==========================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

-- ==========================================================
-- دالة وMحفز لتحديث ranking_score تلقائيًا من مجموع سجلات الطالب
-- ==========================================================
create or replace function public.recalc_student_ranking()
returns trigger as $$
begin
  update public.students
  set ranking_score = (
    select coalesce(sum(memorization_amount), 0)
    from public.attendance_records
    where student_id = coalesce(new.student_id, old.student_id)
  )
  where id = coalesce(new.student_id, old.student_id);
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_recalc_ranking on public.attendance_records;
create trigger trg_recalc_ranking
  after insert or update or delete on public.attendance_records
  for each row execute function public.recalc_student_ranking();

-- ==========================================================
-- دالة لإنشاء profile تلقائيًا عند إنشاء مستخدم جديد في Auth
-- ==========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==========================================================
-- حد أقصى 65 طالبًا لكل معلم (على مستوى قاعدة البيانات)
-- ==========================================================
create or replace function public.check_student_limit()
returns trigger as $$
declare
  current_count int;
begin
  select count(*) into current_count
  from public.students
  where teacher_id = new.teacher_id;

  if current_count >= 65 then
    raise exception 'تم الوصول إلى الحد الأقصى لعدد الطلاب، وهو 65 طالبًا.';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_student_limit on public.students;
create trigger trg_student_limit
  before insert on public.students
  for each row execute function public.check_student_limit();

-- ==========================================================
-- تفعيل Row Level Security
-- ==========================================================
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.attendance_records enable row level security;

-- --- سياسات جدول profiles ---
drop policy if exists "المعلم يرى ملفه الشخصي فقط" on public.profiles;
create policy "المعلم يرى ملفه الشخصي فقط"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "المعلم يعدل ملفه الشخصي فقط" on public.profiles;
create policy "المعلم يعدل ملفه الشخصي فقط"
  on public.profiles for update
  using (auth.uid() = id);

-- --- سياسات جدول students ---
drop policy if exists "المعلم يرى طلابه فقط" on public.students;
create policy "المعلم يرى طلابه فقط"
  on public.students for select
  using (auth.uid() = teacher_id);

drop policy if exists "المعلم يضيف طلابًا لنفسه فقط" on public.students;
create policy "المعلم يضيف طلابًا لنفسه فقط"
  on public.students for insert
  with check (auth.uid() = teacher_id);

drop policy if exists "المعلم يعدل طلابه فقط" on public.students;
create policy "المعلم يعدل طلابه فقط"
  on public.students for update
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id); -- يمنع نقل الطالب لمعلم آخر

drop policy if exists "المعلم يحذف طلابه فقط" on public.students;
create policy "المعلم يحذف طلابه فقط"
  on public.students for delete
  using (auth.uid() = teacher_id);

-- --- سياسات جدول attendance_records ---
drop policy if exists "المعلم يرى سجلات طلابه فقط" on public.attendance_records;
create policy "المعلم يرى سجلات طلابه فقط"
  on public.attendance_records for select
  using (auth.uid() = teacher_id);

drop policy if exists "المعلم يضيف سجلات لطلابه فقط" on public.attendance_records;
create policy "المعلم يضيف سجلات لطلابه فقط"
  on public.attendance_records for insert
  with check (
    auth.uid() = teacher_id
    and exists (
      select 1 from public.students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
  );

drop policy if exists "المعلم يعدل سجلات طلابه فقط" on public.attendance_records;
create policy "المعلم يعدل سجلات طلابه فقط"
  on public.attendance_records for update
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

drop policy if exists "المعلم يحذف سجلات طلابه فقط" on public.attendance_records;
create policy "المعلم يحذف سجلات طلابه فقط"
  on public.attendance_records for delete
  using (auth.uid() = teacher_id);

-- ==========================================================
-- دالة لحساب ترتيب الطالب على مستوى المسجد (كل المعلمين)
-- تُستخدم من التطبيق عبر rpc()
-- ==========================================================
create or replace function public.get_mosque_ranking(p_student_id uuid)
returns int
language sql
security definer
set search_path = public
as $$
  select rank::int from (
    select id, rank() over (order by ranking_score desc) as rank
    from public.students
  ) t
  where t.id = p_student_id;
$$;
