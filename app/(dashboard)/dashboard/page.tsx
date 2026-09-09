import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StudentList from "@/components/StudentList";

const MAX_STUDENTS = 65;

// أقرب يوم سبت (اليوم إن كان سبتًا، وإلا آخر سبت ماضٍ لعرض إحصائياته)
function lastSaturday(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 6 ? 0 : (day + 1) % 7;
  const result = new Date(today);
  result.setDate(today.getDate() - diff);
  return result.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

 const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single() as { data: { name?: string } | null };

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false }) as { data: any[] | null };

  const saturday = lastSaturday();
  const { data: records } = await supabase
    .from("attendance_records")
    .select("is_present")
    .eq("teacher_id", user!.id)
    .eq("date", saturday) as { data: Array<{ is_present: boolean }> | null };

  const present = (records as Array<{ is_present: boolean }> | null)?.filter((r) => r.is_present).length ?? 0;
  const absent = (records as Array<{ is_present: boolean }> | null)?.filter((r) => !r.is_present).length ?? 0;
  const total = students?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-mosque-dark">
        <h1 className="text-xl font-bold text-mosque-dark">
  مرحبًا، {(profile as { name?: string } | null)?.name ?? "المعلم"} 👋
</h1>
        </h1>
        <p className="text-sm text-mosque-dark/60">متابعة حلقة تحفيظ القرآن الكريم</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-mosque-dark">
            {total} / {MAX_STUDENTS}
          </p>
          <p className="text-xs text-mosque-dark/60 mt-1">عدد الطلاب</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-700">{present}</p>
          <p className="text-xs text-mosque-dark/60 mt-1">حاضرون السبت</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">{absent}</p>
          <p className="text-xs text-mosque-dark/60 mt-1">غائبون السبت</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-bold text-mosque-dark">قائمة الطلاب والترتيب</h2>
        <Link href="/students/new" className="btn-primary text-sm">
          + إضافة طالب
        </Link>
      </div>

      <StudentList students={students ?? []} />
    </div>
  );
}
