"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Toast, { ToastType } from "./Toast";

export default function DistributedPointsEditor({
  studentId,
  initialValue,
}: {
  studentId: string;
  initialValue: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [value, setValue] = useState(String(initialValue));
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  async function handleSave() {
    setLoading(true);
    const { error } = await supabase
      .from("students")
      .update({ distributed_points: Number(value) || 0 })
      .eq("id", studentId);
    setLoading(false);

    setToast({
      message: error ? "حدث خطأ أثناء حفظ النقاط الموزعة." : "تم حفظ النقاط الموزعة.",
      type: error ? "error" : "success",
    });

    if (!error) router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="input-field flex-1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={handleSave} disabled={loading} className="btn-secondary text-sm">
        حفظ
      </button>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
