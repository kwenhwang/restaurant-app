"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Sym from "./Sym";

type Item = {
  href: string;
  label: string;
  icon: "house" | "map" | "calendar" | "person";
};

const ITEMS: Item[] = [
  { href: "/", label: "맛집", icon: "house" },
  { href: "/map", label: "지도", icon: "map" },
  { href: "/visits", label: "기록", icon: "calendar" },
  { href: "/profile", label: "프로필", icon: "person" },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed left-3 right-3 bottom-6 h-16 rounded-[28px] z-30 overflow-hidden glass"
      style={{
        boxShadow: "0 8px 28px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)",
        maxWidth: 640,
        marginInline: "auto",
      }}
    >
      <ul className="relative h-full flex items-center justify-around px-2">
        {ITEMS.map((it) => {
          const active =
            it.href === "/"
              ? pathname === "/"
              : pathname.startsWith(it.href);
          const iconName = active ? ((it.icon + ".fill") as `${typeof it.icon}.fill`) : it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className="flex flex-col items-center gap-0.5"
                style={{ color: active ? "var(--accent)" : "var(--text-2)" }}
              >
                <Sym name={iconName} size={24} />
                <span
                  className="text-[10.5px] tracking-tight"
                  style={{ fontWeight: active ? 700 : 500 }}
                >
                  {it.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
