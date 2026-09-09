"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Header({ teacherName }: { teacherName: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-mosque/10 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="مسجد الجوزة" className="w-10 h-10 object-contain" />
          <div>
            <p className="font-bold text-mosque-dark leading-tight">مسجد الجوزة</p>
            <p className="text-xs text-mosque-dark/60">{teacherName}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-secondary text-sm">
          تسجيل الخروج
        </button>
      </div>
    </header>
  );
}
