import { createClient } from "@/lib/supabase/server";
import StudentForm from "@/components/StudentForm";

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: { teacher?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user!.id)
    .single();

  const isAdmin = myProfile?.is_admin ?? false;
  const targetTeacherId = isAdmin && searchParams.teacher ? searchParams.teacher : user!.id;

  const { count } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", targetTeacherId);

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-mosque-dark">إضافة طالب جديد</h1>
      <StudentForm teacherId={targetTeacherId} currentCount={count ?? 0} />
    </div>
  );
}
