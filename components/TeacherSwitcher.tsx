"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function TeacherSwitcher({
  teachers,
  currentTeacherId,
}: {
  teachers: { id: string; name: string }[];
  currentTeacherId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(teacherId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("teacher", teacherId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="card flex items-center gap-2 bg-mosque-gold/10 border-mosque-gold/30">
      <span className="text-sm font-bold text-mosque-dark whitespace-nowrap">
        👁️ عرض حساب المعلم:
      </span>
      <select
        className="input-field flex-1"
        value={currentTeacherId}
        onChange={(e) => handleChange(e.target.value)}
      >
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
