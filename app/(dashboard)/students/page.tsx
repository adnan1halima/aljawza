import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StudentList from "@/components/StudentList";
import TeacherSwitcher from "@/components/TeacherSwitcher";

const MAX_STUDENTS = 65;

export default async function StudentsPage({
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
    .select("id, is_admin")
    .eq("id", user!.id)
    .single();

  const isAdmin = myProfile?.is_admin ?? false;

  let teachers: { id: string; name: string }[] = [];
  if (isAdmin) {
    const { data } = await supabase.from("profiles").select("id, name").order("name");
    teachers = data ?? [];
  }

  const viewTeacherId = isAdmin ? searchParams.teacher || teachers[0]?.id || user!.id : user!.id;

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("teacher_id", viewTeacherId)
    .order("created_at", { ascending: false });

  const total = students?.length ?? 0;

  return (
    <div className="space-y-4">
      {isAdmin && <TeacherSwitcher teachers={teachers} currentTeacherId={viewTeacherId} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-mosque-dark">طلابي</h1>
          <p className="text-sm text-mosque-dark/60">
            عدد الطلاب: {total} / {MAX_STUDENTS}
          </p>
        </div>
        <Link
          href={isAdmin ? `/students/new?teacher=${viewTeacherId}` : "/students/new"}
          className="btn-primary text-sm"
        >
          + إضافة طالب
        </Link>
      </div>

      <StudentList students={students ?? []} />
    </div>
  );
}
