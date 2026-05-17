"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Sym from "./Sym";

type Item = {
  href: string;
  label: string;
  icon: "house" | "map" | "calendar" | "person";
};

const LEFT: Item[] = [
  { href: "/", label: "맛집", icon: "house" },
  { href: "/map", label: "지도", icon: "map" },
];
const RIGHT: Item[] = [
  { href: "/visits", label: "기록", icon: "calendar" },
  { href: "/profile", label: "프로필", icon: "person" },
];

export default function TabBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed left-3 right-3 bottom-6 h-16 rounded-[28px] z-30 glass"
      style={{
        boxShadow: "0 8px 28px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)",
        maxWidth: 640,
        marginInline: "auto",
      }}
    >
      <ul className="relative h-full flex items-center justify-around px-2">
        {LEFT.map((it) => (
          <TabItem key={it.href} item={it} active={isActive(it.href)} />
        ))}

        {/* Center: + 등록 */}
        <li>
          <Link
            href="/capture"
            aria-label="맛집 등록"
            className="relative flex items-center justify-center w-14 h-14 rounded-full text-white -translate-y-3"
            style={{
              background: "var(--accent)",
              boxShadow:
                "0 10px 22px rgba(255,111,61,0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
            }}
          >
            <Sym name="plus" size={26} strokeWidth={2.6} />
          </Link>
        </li>

        {RIGHT.map((it) => (
          <TabItem key={it.href} item={it} active={isActive(it.href)} />
        ))}
      </ul>
    </nav>
  );
}

function TabItem({ item, active }: { item: Item; active: boolean }) {
  const iconName = active ? ((item.icon + ".fill") as `${typeof item.icon}.fill`) : item.icon;
  return (
    <li>
      <Link
        href={item.href}
        className="flex flex-col items-center gap-0.5"
        style={{ color: active ? "var(--accent)" : "var(--text-2)" }}
      >
        <Sym name={iconName} size={24} />
        <span
          className="text-[10.5px] tracking-tight"
          style={{ fontWeight: active ? 700 : 500 }}
        >
          {item.label}
        </span>
      </Link>
    </li>
  );
}
