import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RankingBadge from "@/components/RankingBadge";
import StudentDetailActions from "@/components/StudentDetailActions";
import DistributedPointsEditor from "@/components/DistributedPointsEditor";
import EmptyState from "@/components/EmptyState";

const statusStyles: Record<string, string> = {
  "حضور": "bg-green-100 text-green-700",
  "غياب": "bg-red-100 text-red-600",
  "غياب مبرر": "bg-blue-100 text-blue-700",
  "تأخر": "bg-yellow-100 text-yellow-700",
};

export default async function StudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ملاحظة: سياسات RLS تسمح للمدير برؤية أي طالب، وللمعلم برؤية طلابه فقط
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!student) notFound();

  const { data: records } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("student_id", student.id)
    .order("date", { ascending: false });

  const allRecords = records ?? [];
  const presentDays = allRecords.filter((r) => r.status === "حضور").length;
  const absentDays = allRecords.filter((r) => r.status === "غياب").length;
  const excusedDays = allRecords.filter((r) => r.status === "غياب مبرر").length;
  const lateDays = allRecords.filter((r) => r.status === "تأخر").length;
  const lastRecitation = allRecords.find((r) => r.is_present);

  // ترتيب داخل حلقة المعلم (حسب المجموع الكلي)
  const { data: teacherStudents } = await supabase
    .from("students")
    .select("id, grand_total")
    .eq("teacher_id", student.teacher_id)
    .order("grand_total", { ascending: false });

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

      {/* النقاط: السابقة + الموزعة + المجموع الكلي */}
      <div className="card space-y-3">
        <p className="font-bold text-mosque-dark">النقاط</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-mosque-dark">{student.accumulated_points ?? 0}</p>
            <p className="text-xs text-mosque-dark/60 mt-1">النقاط السابقة</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-mosque-dark">{student.distributed_points ?? 0}</p>
            <p className="text-xs text-mosque-dark/60 mt-1">النقاط الموزعة</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-mosque-gold">{student.grand_total ?? 0}</p>
            <p className="text-xs text-mosque-dark/60 mt-1">المجموع الكلي</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-mosque-dark/70 mb-1">تعديل النقاط الموزعة</p>
          <DistributedPointsEditor
            studentId={student.id}
            initialValue={student.distributed_points ?? 0}
          />
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
                      statusStyles[r.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                {r.is_present && (
                  <div className="text-sm text-mosque-dark/70 space-y-0.5">
                    {r.surah && (
                      <p>
                        {r.surah} ({r.from_ayah}-{r.to_ayah}) · {r.recitation_type}
                      </p>
                    )}
                    {r.pages != null && r.rating != null && (
                      <p>
                        عدد الصفحات: {r.pages} · التقييم: {r.rating}
                      </p>
                    )}
                    <p>
                      اللباس: {r.dress_code} · الأدب: {r.manners} · الانضباط: {r.discipline}
                    </p>
                    {r.evaluation && <p>التقييم الوصفي: {r.evaluation}</p>}
                    {r.behavior && <p>السلوك: {r.behavior}</p>}
                  </div>
                )}
                {r.notes && (
                  <p className="text-sm text-mosque-dark/70 mt-0.5">ملاحظات: {r.notes}</p>
                )}
                <p className="font-bold text-mosque-dark mt-1">
                  مجموع نقاط اليوم: {r.total_points}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* إحصائيات الحضور خلال الدورة كاملة (في نهاية ملف الطالب) */}
      <div className="card">
        <p className="font-bold text-mosque-dark mb-3">إحصائيات الحضور خلال الدورة</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-green-700">{presentDays}</p>
            <p className="text-xs text-mosque-dark/60 mt-1">عدد أيام الحضور</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-600">{absentDays}</p>
            <p className="text-xs text-mosque-dark/60 mt-1">عدد أيام الغياب</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-700">{lateDays}</p>
            <p className="text-xs text-mosque-dark/60 mt-1">عدد أيام التأخر</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-700">{excusedDays}</p>
            <p className="text-xs text-mosque-dark/60 mt-1">عدد أيام الغياب المبرر</p>
          </div>
        </div>
      </div>
    </div>
  );
}
