"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6 text-center">
      <img src="/logo.png" alt="مسجد الجوزة" className="w-20 h-20 object-contain opacity-80" />
      <h1 className="text-2xl font-bold text-mosque-dark">حدث خطأ غير متوقع</h1>
      <p className="text-mosque-dark/70">نعتذر عن هذا الخطأ، حاول مرة أخرى.</p>
      <button onClick={() => reset()} className="btn-primary">
        إعادة المحاولة
      </button>
    </div>
  );
}
