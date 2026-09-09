import { createClient } from "@/lib/supabase/server";
import StudentForm from "@/components/StudentForm";

export default async function NewStudentPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", user!.id);

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-mosque-dark">إضافة طالب جديد</h1>
      <StudentForm teacherId={user!.id} currentCount={count ?? 0} />
    </div>
  );
}
