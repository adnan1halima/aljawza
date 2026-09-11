"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AttendanceStatus, Behavior, RecitationType } from "@/types/database";
import { calcMemorizationPoints, calcTotalPoints, isAttendingStatus } from "@/lib/points";
import Toast, { ToastType } from "./Toast";

const behaviors: Behavior[] = ["ممتاز", "جيد جدًا", "جيد", "يحتاج متابعة", "يحتاج تحسين"];
const recitationTypes: RecitationType[] = ["جديد", "مراجعة"];
const pagesOptions = [1, 2, 3, 4, 5];
const ratingOptions = [1, 2, 3];
const dressOptions = [0, 1, 2, 3];
const mannersOptions = [0, 5];

const statusOptions: { value: AttendanceStatus; label: string; points: number }[] = [
  { value: "حضور", label: "حضور", points: 3 },
  { value: "غياب", label: "غياب", points: -5 },
  { value: "غياب مبرر", label: "غياب مبرر", points: 0 },
  { value: "تأخر", label: "تأخر", points: -2 },
];

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
  const [status, setStatus] = useState<AttendanceStatus>("حضور");
  const [surah, setSurah] = useState("");
  const [fromAyah, setFromAyah] = useState("");
  const [toAyah, setToAyah] = useState("");
  const [recitationType, setRecitationType] = useState<RecitationType>("جديد");
  const [evaluation, setEvaluation] = useState("");
  const [behavior, setBehavior] = useState<Behavior>("جيد");
  const [notes, setNotes] = useState("");

  // حقول نظام النقاط
  const [pages, setPages] = useState<number>(1);
  const [rating, setRating] = useState<number>(1);
  const [dressCode, setDressCode] = useState<number>(3);
  const [manners, setManners] = useState<number>(5);
  const [discipline, setDiscipline] = useState<string>("0");

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const attending = isAttendingStatus(status);
  const disciplineNum = Number(discipline) || 0;
  const memorizationPoints = useMemo(() => calcMemorizationPoints(pages, rating), [pages, rating]);
  const totalPoints = useMemo(
    () => calcTotalPoints(status, pages, rating, dressCode, manners, disciplineNum),
    [status, pages, rating, dressCode, manners, disciplineNum]
  );

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
      status,
      surah: attending ? surah || null : null,
      from_ayah: attending && fromAyah ? Number(fromAyah) : null,
      to_ayah: attending && toAyah ? Number(toAyah) : null,
      recitation_type: attending ? recitationType : null,
      evaluation: attending ? evaluation || null : null,
      behavior: attending ? behavior : null,
      notes: notes || null,
      pages: attending ? pages : null,
      rating: attending ? rating : null,
      dress_code: attending ? dressCode : 0,
      manners: attending ? manners : 0,
      discipline: attending ? disciplineNum : 0,
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

        <div>
          <label className="block mb-1 text-sm font-medium text-mosque-dark">حالة الطالب</label>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`py-2 rounded-xl border text-sm flex flex-col items-center ${
                  status === opt.value
                    ? "bg-mosque text-white border-mosque"
                    : "bg-white border-mosque/20 text-mosque-dark"
                }`}
              >
                <span className="font-bold">{opt.label}</span>
                <span className="text-xs opacity-80">
                  {opt.points > 0 ? `+${opt.points}` : opt.points}
                </span>
              </button>
            ))}
          </div>
        </div>

        {attending && (
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

            {/* عداد النقاط: عدد الصفحات + التقييم + المجموع */}
            <div className="rounded-xl border border-mosque-gold/30 bg-mosque-gold/5 p-3 space-y-3">
              <p className="text-sm font-bold text-mosque-dark">عداد نقاط التسميع</p>

              <div>
                <label className="block mb-1 text-xs font-medium text-mosque-dark/70">
                  عدد الصفحات
                </label>
                <div className="flex gap-2">
                  {pagesOptions.map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPages(p)}
                      className={`w-9 h-9 rounded-lg text-sm border ${
                        pages === p
                          ? "bg-mosque text-white border-mosque"
                          : "bg-white border-mosque/20 text-mosque-dark"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-mosque-dark/70">
                  التقييم
                </label>
                <div className="flex gap-2">
                  {ratingOptions.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRating(r)}
                      className={`w-9 h-9 rounded-lg text-sm border ${
                        rating === r
                          ? "bg-mosque text-white border-mosque"
                          : "bg-white border-mosque/20 text-mosque-dark"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-mosque-gold/20">
                <span className="text-xs text-mosque-dark/70">مجموع نقاط التسميع</span>
                <span className="text-lg font-bold text-mosque-dark">{memorizationPoints}</span>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-mosque-dark">اللباس الإسلامي</label>
              <div className="flex gap-2">
                {dressOptions.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDressCode(d)}
                    className={`w-9 h-9 rounded-lg text-sm border ${
                      dressCode === d
                        ? "bg-mosque text-white border-mosque"
                        : "bg-white border-mosque/20 text-mosque-dark"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-mosque-dark">الالتزام بالأدب</label>
              <div className="flex gap-2">
                {mannersOptions.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setManners(m)}
                    className={`px-4 h-9 rounded-lg text-sm border ${
                      manners === m
                        ? "bg-mosque text-white border-mosque"
                        : "bg-white border-mosque/20 text-mosque-dark"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-mosque-dark">
                الانضباط (اختياري)
              </label>
              <input
                type="number"
                className="input-field"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                placeholder="رقم موجب أو سالب، مثال: 2 أو -3"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-mosque-dark">
                تقييم التسميع (وصفي)
              </label>
              <input
                className="input-field"
                value={evaluation}
                onChange={(e) => setEvaluation(e.target.value)}
                placeholder="مثال: تسميع جيد مع أخطاء بسيطة في التجويد"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-mosque-dark">السلوك العام</label>
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

        <div className="flex items-center justify-between rounded-xl bg-mosque text-white px-4 py-3">
          <span className="font-bold">مجموع نقاط هذا اليوم</span>
          <span className="text-2xl font-bold">{totalPoints}</span>
        </div>

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
