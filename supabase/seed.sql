-- ==========================================================
-- بيانات تجريبية - مسجد الجوزة
-- شغّل هذا الملف بعد: 1) تنفيذ schema.sql   2) إنشاء حسابات المعلمين
-- (طريقة إنشاء حسابات المعلمين موضحة في README.md)
-- ==========================================================

-- هذا المثال يفترض أن حساب المعلم الأول تم إنشاؤه بالبريد التالي:
-- malek@aljawzah.local
-- غيّر البريد أدناه إذا استخدمت بريدًا مختلفًا.

do $$
declare
  v_teacher_id uuid;
  v_student_1 uuid;
  v_student_2 uuid;
begin
  select id into v_teacher_id from public.profiles where email = 'malek@aljawzah.local' limit 1;

  if v_teacher_id is null then
    raise notice 'لم يتم العثور على حساب المعلم. أنشئ الحساب أولًا من Authentication ثم أعد تشغيل هذا الملف.';
    return;
  end if;

  insert into public.students (id, teacher_id, name, phone, housing, previous_memorization, notes)
  values
    (gen_random_uuid(), v_teacher_id, 'عبد الرحمن أحمد', '0500000001', 'حي النهضة', 'حفظ جزء عم وجزء تبارك', 'طالب ملتزم')
  returning id into v_student_1;

  insert into public.students (id, teacher_id, name, phone, housing, previous_memorization, notes)
  values
    (gen_random_uuid(), v_teacher_id, 'يوسف خالد', '0500000002', 'حي الجوزة', 'حفظ جزء عم', null)
  returning id into v_student_2;

  -- سجلات يوم سبت تجريبية (يجب أن يكون التاريخ يوم سبت فعلي)
  insert into public.attendance_records
    (student_id, teacher_id, date, is_present, surah, from_ayah, to_ayah, memorization_amount, recitation_type, evaluation, behavior, notes)
  values
    (v_student_1, v_teacher_id, '2025-01-04', true, 'سورة النبأ', 1, 20, 1, 'جديد', 'تسميع جيد جدًا', 'ممتاز', 'ما شاء الله'),
    (v_student_2, v_teacher_id, '2025-01-04', true, 'سورة عبس', 1, 15, 0.5, 'مراجعة', 'يحتاج مزيد من التثبيت', 'جيد', null);

  raise notice 'تمت إضافة بيانات تجريبية بنجاح لحساب المعلم %', v_teacher_id;
end $$;
