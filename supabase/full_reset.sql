-- ==========================================================
-- إعادة ضبط كاملة ونظيفة لقاعدة بيانات مسجد الجوزة
-- يجمع schema.sql + migration_02 + migration_03 في ملف واحد نهائي
-- نفّذه كاملًا مرة واحدة من SQL Editor
--
-- ⚠️ تحذير: هذا الملف يحذف جداول students و attendance_records
-- الحالية (وكل بياناتها) ثم يعيد إنشاءها نظيفة من الصفر.
-- حسابات المعلمين في Authentication > Users لن تتأثر إطلاقًا.
-- ==========================================================

-- ----------------------------------------------------------
-- 0) حذف الجداول والدوال القديمة (إن وجدت) للبدء نظيفًا
-- ----------------------------------------------------------
drop table if exists public.attendance_records cascade;
drop table if exists public.students cascade;
-- profiles لا تُحذف أبدًا لأنها مرتبطة بحسابات المعلمين الحقيقية في Auth

drop function if exists public.recalc_student_ranking() cascade;
drop function if exists public.check_student_limit() cascade;
drop function if exists public.calc_memorization_points(int, int) cascade;
drop function if exists public.calc_status_points(text) cascade;
drop function if exists public.get_mosque_ranking(uuid) cascade;
drop function if exists public.is_current_user_admin() cascade;
drop function if exists public.set_updated_at() cascade;

-- ----------------------------------------------------------
-- 1) التأكد من وجود جدول profiles بالأعمدة الصحيحة (لا يُحذف، فقط يُضمن اكتماله)
-- ----------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- ----------------------------------------------------------
-- 2) جدول الطلاب (نسخة نهائية، بالأسماء الصحيحة للأعمدة)
-- ----------------------------------------------------------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  phone text,
  housing text,
  previous_memorization text,
  notes text,
  accumulated_points numeric not null default 0,   -- النقاط السابقة (تلقائي)
  distributed_points numeric not null default 0,    -- النقاط الموزعة (يدوي)
  grand_total numeric generated always as (accumulated_points + distributed_points) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_students_teacher_id on public.students (teacher_id);

-- ----------------------------------------------------------
-- 3) دوال حساب النقاط
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
-- 4) جدول سجلات يوم السبت (نسخة نهائية)
-- ----------------------------------------------------------
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  status text not null check (status in ('حضور', 'غياب', 'غياب مبرر', 'تأخر')),
  is_present boolean generated always as (status in ('حضور', 'تأخر')) stored,
  surah text,
  from_ayah int,
  to_ayah int,
  recitation_type text check (recitation_type in ('جديد', 'مراجعة')),
  evaluation text,
  behavior text check (
    behavior in ('ممتاز', 'جيد جدًا', 'جيد', 'يحتاج متابعة', 'يحتاج تحسين')
  ),
  notes text,
  pages int check (pages is null or pages between 1 and 5),
  rating int check (rating is null or rating in (1, 2, 3)),
  dress_code int not null default 0 check (dress_code in (0, 1, 2, 3)),
  manners int not null default 0 check (manners in (0, 5)),
  discipline int not null default 0,
  total_points int generated always as (
    public.calc_status_points(status)
    + case
        when status in ('حضور', 'تأخر')
        then public.calc_memorization_points(pages, rating) + dress_code + manners + discipline
        else 0
      end
  ) stored,
  created_at timestamptz not null default now(),

  constraint unique_student_date unique (student_id, date),
  constraint saturday_only check (extract(dow from date) = 6)
);

create index idx_records_student_id on public.attendance_records (student_id);
create index idx_records_teacher_id on public.attendance_records (teacher_id);

-- ----------------------------------------------------------
-- 5) دوال ومحفزات مساعدة
-- ----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_students_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

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

create trigger trg_recalc_ranking
  after insert or update or delete on public.attendance_records
  for each row execute function public.recalc_student_ranking();

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

create trigger trg_student_limit
  before insert on public.students
  for each row execute function public.check_student_limit();

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

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ----------------------------------------------------------
-- 6) تفعيل Row Level Security (لا تعطّله أبدًا بعد الآن)
-- ----------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.attendance_records enable row level security;

-- profiles
drop policy if exists "المعلم يرى ملفه الشخصي فقط" on public.profiles;
create policy "المعلم يرى ملفه الشخصي فقط"
  on public.profiles for select
  using (auth.uid() = id or public.is_current_user_admin());

drop policy if exists "المعلم يعدل ملفه الشخصي فقط" on public.profiles;
create policy "المعلم يعدل ملفه الشخصي فقط"
  on public.profiles for update
  using (auth.uid() = id or public.is_current_user_admin());

-- students
drop policy if exists "select_students" on public.students;
create policy "select_students"
  on public.students for select
  using (auth.uid() = teacher_id or public.is_current_user_admin());

drop policy if exists "insert_students" on public.students;
create policy "insert_students"
  on public.students for insert
  with check (auth.uid() = teacher_id or public.is_current_user_admin());

drop policy if exists "update_students" on public.students;
create policy "update_students"
  on public.students for update
  using (auth.uid() = teacher_id or public.is_current_user_admin())
  with check (auth.uid() = teacher_id or public.is_current_user_admin());

drop policy if exists "delete_students" on public.students;
create policy "delete_students"
  on public.students for delete
  using (auth.uid() = teacher_id or public.is_current_user_admin());

-- attendance_records
drop policy if exists "select_records" on public.attendance_records;
create policy "select_records"
  on public.attendance_records for select
  using (auth.uid() = teacher_id or public.is_current_user_admin());

drop policy if exists "insert_records" on public.attendance_records;
create policy "insert_records"
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

drop policy if exists "update_records" on public.attendance_records;
create policy "update_records"
  on public.attendance_records for update
  using (auth.uid() = teacher_id or public.is_current_user_admin())
  with check (auth.uid() = teacher_id or public.is_current_user_admin());

drop policy if exists "delete_records" on public.attendance_records;
create policy "delete_records"
  on public.attendance_records for delete
  using (auth.uid() = teacher_id or public.is_current_user_admin());

-- ----------------------------------------------------------
-- 7) إعادة تفعيل صلاحية المدير لحساب أ. مالك
-- ----------------------------------------------------------
update public.profiles set is_admin = true where email = 'tyytyufvjuhh@gmail.com';
