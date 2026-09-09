"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "الرئيسية", icon: "🏠" },
  { href: "/students", label: "الطلاب", icon: "📋" },
  { href: "/students/new", label: "إضافة طالب", icon: "➕" },
  { href: "/settings", label: "الإعدادات", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-mosque/10 flex md:hidden">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs ${
              active ? "text-mosque-dark font-bold" : "text-mosque-dark/50"
            }`}
          >
            <span className="text-lg">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarDesktop() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block w-56 shrink-0">
      <div className="sticky top-20 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                active
                  ? "bg-mosque text-white font-bold"
                  : "text-mosque-dark/70 hover:bg-mosque-cream"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
