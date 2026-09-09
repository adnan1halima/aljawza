// جدول نقاط التسميع - مطابق تمامًا لما يحسبه قاعدة البيانات (calc_memorization_points)
// محصور حصرًا في عدد صفحات من 1 إلى 5 وتقييم من 1 إلى 3

const POINTS_TABLE: Record<number, Record<number, number>> = {
  1: { 1: 3, 2: 4, 3: 5 },
  2: { 1: 5, 2: 8, 3: 11 },
  3: { 1: 9, 2: 13, 3: 17 },
  4: { 1: 13, 2: 18, 3: 23 },
  5: { 1: 14, 2: 20, 3: 26 },
};

// نقاط حالة الحضور - مطابقة لدالة calc_status_points في قاعدة البيانات
const STATUS_POINTS: Record<string, number> = {
  "حضور": 3,
  "غياب": -5,
  "غياب مبرر": 0,
  "تأخر": -2,
};

export function calcMemorizationPoints(pages: number | null, rating: number | null): number {
  if (!pages || !rating) return 0;
  return POINTS_TABLE[pages]?.[rating] ?? 0;
}

export function calcStatusPoints(status: string): number {
  return STATUS_POINTS[status] ?? 0;
}

// هل هذه الحالة تُعتبر "حضورًا فعليًا" يُسجَّل معه تسميع؟ (حضور أو تأخر)
export function isAttendingStatus(status: string): boolean {
  return status === "حضور" || status === "تأخر";
}

export function calcTotalPoints(
  status: string,
  pages: number | null,
  rating: number | null,
  dressCode: number,
  manners: number,
  discipline: number
): number {
  const statusPoints = calcStatusPoints(status);
  if (!isAttendingStatus(status)) return statusPoints;
  return statusPoints + calcMemorizationPoints(pages, rating) + dressCode + manners + discipline;
}
