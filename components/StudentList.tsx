"use client";

import { useMemo, useState } from "react";
import type { Student } from "@/types/database";
import StudentCard from "./StudentCard";
import SearchBox from "./SearchBox";
import EmptyState from "./EmptyState";
import Link from "next/link";

export default function StudentList({
  students,
}: {
  students: (Student & { ranking_score?: number })[];
}) {
  const [query, setQuery] = useState("");

  // ترتيب الطلاب من الأكثر حفظًا إلى الأقل حفظًا
  const ranked = useMemo(
    () => [...students].sort((a, b) => (b.ranking_score ?? 0) - (a.ranking_score ?? 0)),
    [students]
  );

  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    ranked.forEach((s, i) => map.set(s.id, i + 1));
    return map;
  }, [ranked]);

  const filtered = useMemo(
    () => ranked.filter((s) => s.name.includes(query.trim())),
    [ranked, query]
  );

  if (students.length === 0) {
    return (
      <EmptyState
        title="لا يوجد طلاب بعد"
        description="ابدأ بإضافة أول طالب في حلقتك."
        action={
          <Link href="/students/new" className="btn-primary mt-2">
            إضافة طالب جديد
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <SearchBox value={query} onChange={setQuery} />
      {filtered.length === 0 ? (
        <EmptyState title="لا توجد نتائج مطابقة للبحث" />
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <StudentCard key={s.id} student={s} rank={rankMap.get(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
