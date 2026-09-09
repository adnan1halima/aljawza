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
    .eq("id", id)
    .eq("teacher_id", user!.id)
    .single() as { data: { id: string; name?: string; [key: string]: any } | null };
}
