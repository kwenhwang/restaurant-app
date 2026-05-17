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

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Floating "+" register button — separate from nav so it sits above */}
      <Link
        href="/capture"
        aria-label="맛집 등록"
        className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center justify-center rounded-full text-white"
        style={{
          bottom: 60,
          width: 64,
          height: 64,
          background: "var(--accent)",
          boxShadow:
            "0 14px 28px rgba(255,111,61,0.5), 0 4px 10px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.4)",
        }}
      >
        <Sym name="plus" size={30} strokeWidth={2.6} />
      </Link>

      <nav
        className="fixed left-3 right-3 bottom-6 h-16 rounded-[28px] z-30"
        style={{
          background: "var(--surface)",
          boxShadow:
            "0 8px 28px rgba(0,0,0,0.14), 0 1px 2px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)",
          maxWidth: 640,
          marginInline: "auto",
        }}
      >
        <ul className="relative h-full grid grid-cols-[1fr_1fr_72px_1fr_1fr] items-center px-1">
          {/* 0: 맛집 */}
          <TabItem item={ITEMS[0]} active={isActive(ITEMS[0].href)} />
          {/* 1: 지도 */}
          <TabItem item={ITEMS[1]} active={isActive(ITEMS[1].href)} />
          {/* 2: empty center — reserved for floating + button */}
          <span aria-hidden="true" />
          {/* 3: 기록 */}
          <TabItem item={ITEMS[2]} active={isActive(ITEMS[2].href)} />
          {/* 4: 프로필 */}
          <TabItem item={ITEMS[3]} active={isActive(ITEMS[3].href)} />
        </ul>
      </nav>
    </>
  );
}

function TabItem({ item, active }: { item: Item; active: boolean }) {
  const iconName = active ? ((item.icon + ".fill") as `${typeof item.icon}.fill`) : item.icon;
  return (
    <li className="flex justify-center">
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
