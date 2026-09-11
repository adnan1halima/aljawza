"use client";

import Link from "next/link";
import type { Student } from "@/types/database";
import RankingBadge from "./RankingBadge";

export default function StudentCard({
  student,
  rank,
}: {
  student: Student;
  rank?: number | null;
}) {
  return (
    <Link
      href={`/students/${student.id}`}
      className="card flex items-center justify-between hover:shadow-md transition-shadow"
    >
      <div>
        <p className="font-bold text-mosque-dark">{student.name}</p>
        <p className="text-xs text-mosque-dark/50 mt-0.5">
          {student.phone || "بدون رقم هاتف"}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {rank != null && <RankingBadge rank={rank} />}
        <span className="text-xs text-mosque-dark/50">
          المجموع الكلي: {student.grand_total ?? 0}
        </span>
      </div>
    </Link>
  );
}
