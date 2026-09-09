export default function LoadingState({ label = "جاري التحميل..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-mosque-dark/60">
      <div className="w-8 h-8 border-4 border-mosque/20 border-t-mosque rounded-full animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
