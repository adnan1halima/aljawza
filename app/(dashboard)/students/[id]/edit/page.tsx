import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentForm from "@/components/StudentForm";

export default async function EditStudentPage({
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

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-mosque-dark">تعديل بيانات {student.name}</h1>
      <StudentForm student={student} teacherId={user!.id} currentCount={0} />
    </div>
  );
}
