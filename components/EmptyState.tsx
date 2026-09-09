export default function EmptyState({
  title = "لا توجد بيانات",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
      <span className="text-4xl mb-2">📭</span>
      <p className="font-bold text-mosque-dark">{title}</p>
      {description && <p className="text-sm text-mosque-dark/60 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
