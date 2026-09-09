"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Student } from "@/types/database";
import Toast, { ToastType } from "./Toast";

const MAX_STUDENTS = 65;

export default function StudentForm({
  student,
  teacherId,
  currentCount,
}: {
  student?: Student;
  teacherId: string;
  currentCount: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(student);

  const [name, setName] = useState(student?.name ?? "");
  const [phone, setPhone] = useState(student?.phone ?? "");
  const [housing, setHousing] = useState(student?.housing ?? "");
  const [previousMemorization, setPreviousMemorization] = useState(
    student?.previous_memorization ?? ""
  );
  const [notes, setNotes] = useState(student?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const limitReached = !isEdit && currentCount >= MAX_STUDENTS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setToast({ message: "اسم الطالب إجباري.", type: "error" });
      return;
    }

    if (limitReached) {
      setToast({
        message: "تم الوصول إلى الحد الأقصى لعدد الطلاب، وهو 65 طالبًا.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      housing: housing.trim() || null,
      previous_memorization: previousMemorization.trim() || null,
      notes: notes.trim() || null,
    };

    const { error } = isEdit
      ? await supabase.from("students").update(payload).eq("id", student!.id)
      : await supabase.from("students").insert({ ...payload, teacher_id: teacherId });

    setLoading(false);

    if (error) {
      setToast({
        message: error.message.includes("65")
          ? "تم الوصول إلى الحد الأقصى لعدد الطلاب، وهو 65 طالبًا."
          : "حدث خطأ أثناء الحفظ، حاول مرة أخرى.",
        type: "error",
      });
      return;
    }

    router.push("/students");
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-mosque-dark">
            اسم الطالب <span className="text-red-500">*</span>
          </label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-mosque-dark">رقم الهاتف</label>
          <input
            className="input-field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-mosque-dark">السكن</label>
          <input
            className="input-field"
            value={housing}
            onChange={(e) => setHousing(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-mosque-dark">
            المحفوظات السابقة
          </label>
          <textarea
            className="input-field min-h-28"
            value={previousMemorization}
            onChange={(e) => setPreviousMemorization(e.target.value)}
            placeholder="مثال: حفظ جزء عم كاملًا، ويحفظ جزءًا من سورة البقرة..."
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-mosque-dark">
            ملاحظات إضافية
          </label>
          <textarea
            className="input-field min-h-20"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {limitReached && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">
            تم الوصول إلى الحد الأقصى لعدد الطلاب، وهو 65 طالبًا.
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={loading || limitReached} className="btn-primary flex-1">
            {loading ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة الطالب"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            إلغاء
          </button>
        </div>
      </form>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}
