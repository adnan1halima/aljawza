export default function RankingBadge({ rank }: { rank: number | null }) {
  if (!rank) return null;

  const styles =
    rank === 1
      ? "bg-mosque-gold/20 text-mosque-gold border-mosque-gold/40"
      : rank <= 3
      ? "bg-mosque/10 text-mosque-dark border-mosque/30"
      : "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${styles}`}>
      🏅 الترتيب {rank}
    </span>
  );
}
