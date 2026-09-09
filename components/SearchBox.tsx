"use client";

export default function SearchBox({
  value,
  onChange,
  placeholder = "ابحث باسم الطالب...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pr-9"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-mosque-dark/40">🔍</span>
    </div>
  );
}
