import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RankingBadge from "@/components/RankingBadge";
import StudentDetailActions from "@/components/StudentDetailActions";
import EmptyState from "@/components/EmptyState";

export default async function StudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", params.id)
    .eq("teacher_id", user!.id)
    .single();

  if (!student) notFound();

  const { data: records } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("student_id", student.id)
    .order("date", { ascending: false });

  const allRecords = records ?? [];
  const presentDays = allRecords.filter((r) => r.is_present).length;
  const absentDays = allRecords.filter((r) => !r.is_present).length;
  const lastRecitation = allRecords.find((r) => r.is_present);

  // ترتيب داخل حلقة المعلم
  const { data: teacherStudents } = await supabase
    .from("students")
    .select("id, ranking_score")
    .eq("teacher_id", user!.id)
    .order("ranking_score", { ascending: false });

  const circleRank =
    (teacherStudents ?? []).findIndex((s) => s.id === student.id) + 1 || null;

  // ترتيب على مستوى المسجد عبر دالة قاعدة البيانات
  const { data: mosqueRank } = await supabase.rpc("get_mosque_ranking", {
    p_student_id: student.id,
  });

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="card space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-mosque-dark">{student.name}</h1>
            <p className="text-sm text-mosque-dark/60 mt-1">
              {student.phone || "بدون رقم هاتف"} · {student.housing || "بدون سكن مسجل"}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <RankingBadge rank={circleRank} />
            {mosqueRank != null && (
              <span className="text-xs text-mosque-dark/50">
                ترتيبه على مستوى المسجد: {mosqueRank}
              </span>
            )}
          </div>
        </div>

        {student.previous_memorization && (
          <div>
            <p className="text-xs font-bold text-mosque-dark/70">المحفوظات السابقة</p>
            <p className="text-sm text-mosque-dark/80 whitespace-pre-line">
              {student.previous_memorization}
            </p>
          </div>
        )}

        {student.notes && (
          <div>
            <p className="text-xs font-bold text-mosque-dark/70">ملاحظات</p>
            <p className="text-sm text-mosque-dark/80 whitespace-pre-line">{student.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-lg font-bold text-mosque-dark">
            {student.ranking_score ?? 0}
          </p>
          <p className="text-xs text-mosque-dark/60 mt-1">إجمالي الحفظ</p>
        </div>
        <div className="card text-center">
          <p className="text-lg font-bold text-green-700">{presentDays}</p>
          <p className="text-xs text-mosque-dark/60 mt-1">أيام الحضور</p>
        </div>
        <div className="card text-center">
          <p className="text-lg font-bold text-red-600">{absentDays}</p>
          <p className="text-xs text-mosque-dark/60 mt-1">أيام الغياب</p>
        </div>
      </div>

      {lastRecitation && (
        <div className="card">
          <p className="text-xs font-bold text-mosque-dark/70 mb-1">آخر تسميع</p>
          <p className="text-sm text-mosque-dark">
            {lastRecitation.surah} ({lastRecitation.from_ayah}-{lastRecitation.to_ayah}) ·{" "}
            {lastRecitation.behavior}
          </p>
          <p className="text-xs text-mosque-dark/50 mt-1">{lastRecitation.date}</p>
        </div>
      )}

      <StudentDetailActions studentId={student.id} studentName={student.name} />

      <div>
        <h2 className="font-bold text-mosque-dark mb-2">سجل أيام السبت</h2>
        {allRecords.length === 0 ? (
          <EmptyState
            title="لا توجد سجلات بعد"
            description="سجّل أول حضور لهذا الطالب يوم السبت."
          />
        ) : (
          <div className="space-y-2">
            {allRecords.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-mosque-dark text-sm">{r.date}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      r.is_present
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {r.is_present ? "حاضر" : "غائب"}
                  </span>
                </div>
                {r.is_present && (
                  <div className="text-sm text-mosque-dark/70 space-y-0.5">
                    {r.surah && (
                      <p>
                        {r.surah} ({r.from_ayah}-{r.to_ayah}) · {r.recitation_type}
                      </p>
                    )}
                    <p>مقدار الحفظ: {r.memorization_amount}</p>
                    {r.evaluation && <p>التقييم: {r.evaluation}</p>}
                    {r.behavior && <p>السلوك: {r.behavior}</p>}
                    {r.notes && <p>ملاحظات: {r.notes}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
