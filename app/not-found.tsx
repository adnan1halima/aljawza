import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6 text-center">
      <img src="/logo.png" alt="مسجد الجوزة" className="w-20 h-20 object-contain opacity-80" />
      <h1 className="text-3xl font-bold text-mosque-dark">404</h1>
      <p className="text-mosque-dark/70">الصفحة التي تبحث عنها غير موجودة.</p>
      <Link href="/dashboard" className="btn-primary">
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
}
