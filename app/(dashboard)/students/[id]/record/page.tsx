import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DailyRecordForm from "@/components/DailyRecordForm";

export default async function AddRecordPage({
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
    .select("id, name")
    .eq("id", params.id)
    .eq("teacher_id", user!.id)
    .single();

  if (!student) notFound();

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-mosque-dark">
        تسجيل يوم السبت - {student.name}
      </h1>
      <DailyRecordForm studentId={student.id} teacherId={user!.id} />
    </div>
  );
}
