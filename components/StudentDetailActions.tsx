"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "./ConfirmDialog";
import Toast, { ToastType } from "./Toast";

export default function StudentDetailActions({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  async function handleDelete() {
    setConfirmOpen(false);
    const { error } = await supabase.from("students").delete().eq("id", studentId);

    if (error) {
      setToast({ message: "حدث خطأ أثناء حذف الطالب.", type: "error" });
      return;
    }

    router.push("/students");
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        <Link href={`/students/${studentId}/record`} className="btn-primary flex-1 text-center">
          تسجيل يوم السبت
        </Link>
        <Link href={`/students/${studentId}/edit`} className="btn-secondary">
          تعديل
        </Link>
        <button onClick={() => setConfirmOpen(true)} className="btn-danger">
          حذف
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="حذف الطالب"
        description={`هل أنت متأكد من حذف الطالب "${studentName}"؟ سيتم حذف جميع سجلاته ولا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}
