"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Toast, { ToastType } from "./Toast";

export default function SettingsForm({
  currentName,
  email,
}: {
  currentName: string;
  email: string;
}) {
  const supabase = createClient();
  const [name, setName] = useState(currentName);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim() })
      .eq("id", user!.id);

    setLoading(false);
    setToast({
      message: error ? "حدث خطأ أثناء تحديث الاسم." : "تم تحديث الاسم بنجاح.",
      type: error ? "error" : "success",
    });
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setToast({ message: "كلمة المرور يجب ألا تقل عن 6 أحرف.", type: "error" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    setNewPassword("");

    setToast({
      message: error ? "حدث خطأ أثناء تحديث كلمة المرور." : "تم تحديث كلمة المرور بنجاح.",
      type: error ? "error" : "success",
    });
  }

  return (
    <>
      <form onSubmit={handleUpdateName} className="card space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-mosque-dark">
            البريد الإلكتروني
          </label>
          <input className="input-field bg-gray-50" value={email} disabled dir="ltr" />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-mosque-dark">اسم المعلم</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          حفظ الاسم
        </button>
      </form>

      <form onSubmit={handleUpdatePassword} className="card space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-mosque-dark">
            كلمة مرور جديدة
          </label>
          <input
            type="password"
            className="input-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            dir="ltr"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-secondary">
          تحديث كلمة المرور
        </button>
      </form>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}
