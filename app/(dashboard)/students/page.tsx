import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StudentList from "@/components/StudentList";

const MAX_STUDENTS = 65;

export default async function StudentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false });

  const total = students?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-mosque-dark">طلابي</h1>
          <p className="text-sm text-mosque-dark/60">
            عدد الطلاب: {total} / {MAX_STUDENTS}
          </p>
        </div>
        <Link href="/students/new" className="btn-primary text-sm">
          + إضافة طالب
        </Link>
      </div>

      <StudentList students={students ?? []} />
    </div>
  );
}
