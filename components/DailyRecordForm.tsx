"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Behavior, RecitationType } from "@/types/database";
import Toast, { ToastType } from "./Toast";

const behaviors: Behavior[] = ["ممتاز", "جيد جدًا", "جيد", "يحتاج متابعة", "يحتاج تحسين"];
const recitationTypes: RecitationType[] = ["جديد", "مراجعة"];

// يحسب أقرب يوم سبت قادم (أو اليوم إن كان سبتًا) كقيمة افتراضية للحقل
function nextSaturday(): string {
  const today = new Date();
  const day = today.getDay(); // 0 = الأحد ... 6 = السبت
  const diff = (6 - day + 7) % 7;
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return result.toISOString().slice(0, 10);
}

function isSaturday(dateStr: string): boolean {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay() === 6;
}

export default function DailyRecordForm({
  studentId,
  teacherId,
}: {
  studentId: string;
  teacherId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [date, setDate] = useState(nextSaturday());
  const [isPresent, setIsPresent] = useState(true);
  const [surah, setSurah] = useState("");
  const [fromAyah, setFromAyah] = useState("");
  const [toAyah, setToAyah] = useState("");
  const [memorizationAmount, setMemorizationAmount] = useState("0");
  const [recitationType, setRecitationType] = useState<RecitationType>("جديد");
  const [evaluation, setEvaluation] = useState("");
  const [behavior, setBehavior] = useState<Behavior>("جيد");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isSaturday(date)) {
      setToast({
        message: "الدوام في هذا النظام مخصص ليوم السبت فقط.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("attendance_records").insert({
      student_id: studentId,
      teacher_id: teacherId,
      date,
      is_present: isPresent,
      surah: isPresent ? surah || null : null,
      from_ayah: isPresent && fromAyah ? Number(fromAyah) : null,
      to_ayah: isPresent && toAyah ? Number(toAyah) : null,
      memorization_amount: isPresent ? Number(memorizationAmount) || 0 : 0,
      recitation_type: isPresent ? recitationType : null,
      evaluation: isPresent ? evaluation || null : null,
      behavior: isPresent ? behavior : null,
      notes: notes || null,
    });

    setLoading(false);

    if (error) {
      const msg = error.message.includes("unique_student_date")
        ? "تم تسجيل سجل لهذا الطالب في هذا التاريخ من قبل."
        : error.message.includes("saturday_only")
        ? "الدوام في هذا النظام مخصص ليوم السبت فقط."
        : "حدث خطأ أثناء حفظ السجل.";
      setToast({ message: msg, type: "error" });
      return;
    }

    router.push(`/students/${studentId}`);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-mosque-dark">
            التاريخ (يوم السبت فقط)
          </label>
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsPresent(true)}
            className={`flex-1 py-2 rounded-xl border ${
              isPresent ? "bg-mosque text-white border-mosque" : "bg-white border-mosque/20"
            }`}
          >
            حاضر
          </button>
          <button
            type="button"
            onClick={() => setIsPresent(false)}
            className={`flex-1 py-2 rounded-xl border ${
              !isPresent ? "bg-red-600 text-white border-red-600" : "bg-white border-mosque/20"
            }`}
          >
            غائب
          </button>
        </div>

        {isPresent && (
          <>
            <div>
              <label className="block mb-1 text-sm font-medium text-mosque-dark">السورة</label>
              <input
                className="input-field"
                value={surah}
                onChange={(e) => setSurah(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-mosque-dark">من آية</label>
                <input
                  type="number"
                  min={1}
                  className="input-field"
                  value={fromAyah}
                  onChange={(e) => setFromAyah(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-mosque-dark">إلى آية</label>
                <input
                  type="number"
                  min={1}
                  className="input-field"
                  value={toAyah}
                  onChange={(e) => setToAyah(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-mosque-dark">
                مقدار الحفظ (بالصفحات)
              </label>
              <input
                type="number"
                step="0.25"
                min={0}
                className="input-field"
                value={memorizationAmount}
                onChange={(e) => setMemorizationAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-mosque-dark">نوع التسميع</label>
              <div className="flex gap-2">
                {recitationTypes.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setRecitationType(t)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      recitationType === t
                        ? "bg-mosque text-white border-mosque"
                        : "bg-white border-mosque/20 text-mosque-dark"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-mosque-dark">
                تقييم التسميع
              </label>
              <input
                className="input-field"
                value={evaluation}
                onChange={(e) => setEvaluation(e.target.value)}
                placeholder="مثال: تسميع جيد مع أخطاء بسيطة في التجويد"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-mosque-dark">السلوك</label>
              <div className="flex flex-wrap gap-2">
                {behaviors.map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => setBehavior(b)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      behavior === b
                        ? "bg-mosque text-white border-mosque"
                        : "bg-white border-mosque/20 text-mosque-dark"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block mb-1 text-sm font-medium text-mosque-dark">
            ملاحظات المعلم
          </label>
          <textarea
            className="input-field min-h-20"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? "جاري الحفظ..." : "حفظ السجل"}
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
