"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/messages", label: "Messages",
    icon: (
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
    ),
  },
  {
    href: "/meetings", label: "Meetings",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/feed", label: "Feed",
    icon: (
      <path d="M4 19 L12 5 L20 19 M8.5 14.5 h7" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/profile", label: "Profile",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" strokeLinecap="round" />
      </>
    ),
  },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 border-t border-line bg-elev/95 backdrop-blur">
      <div className="flex">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                active ? "text-gold" : "text-dim"
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                {t.icon}
              </svg>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
