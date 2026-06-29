"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Sym from "./Sym";

type Item = {
  href: string;
  label: string;
  icon: "house" | "map" | "bookmark" | "person";
};

const ITEMS: Item[] = [
  { href: "/", label: "맛집", icon: "house" },
  { href: "/map", label: "지도", icon: "map" },
  { href: "/wishlist", label: "찜", icon: "bookmark" },
  { href: "/profile", label: "프로필", icon: "person" },
];

// Routes that have their own sticky save bar / dedicated flow.
// We hide the TabBar + floating + button on these so the screen stays uncluttered.
const HIDDEN_ON = ["/capture", "/restaurants/new", "/share-receive"];

export default function TabBar() {
  const pathname = usePathname();

  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }
  if (pathname.match(/^\/restaurants\/[^/]+\/edit$/)) return null;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Floating "+" register button — separate from nav so it sits above.
          v3: respects safe-area inset so it clears the home indicator. */}
      <Link
        href="/capture"
        aria-label="맛집 등록"
        className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center justify-center rounded-full text-white transition-transform active:scale-95"
        style={{
          bottom: "calc(60px + env(safe-area-inset-bottom, 0px))",
          width: 64,
          height: 64,
          background: "var(--accent)",
          boxShadow:
            "0 6px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.4)",
        }}
      >
        <Sym name="plus" size={30} strokeWidth={2.6} />
      </Link>

      <nav
        aria-label="주요 메뉴"
        className="fixed left-3 right-3 z-30 h-16 rounded-[28px]"
        style={{
          bottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
          background: "var(--surface)",
          boxShadow:
            "0 8px 28px rgba(0,0,0,0.14), 0 1px 2px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)",
          maxWidth: 640,
          marginInline: "auto",
        }}
      >
        <ul className="relative h-full grid grid-cols-[1fr_1fr_72px_1fr_1fr] items-center px-1">
          <TabItem item={ITEMS[0]} active={isActive(ITEMS[0].href)} />
          <TabItem item={ITEMS[1]} active={isActive(ITEMS[1].href)} />
          {/* center — reserved for the floating + button */}
          <span aria-hidden="true" />
          <TabItem item={ITEMS[2]} active={isActive(ITEMS[2].href)} />
          <TabItem item={ITEMS[3]} active={isActive(ITEMS[3].href)} />
        </ul>
      </nav>
    </>
  );
}

function TabItem({ item, active }: { item: Item; active: boolean }) {
  const iconName = active
    ? ((item.icon + ".fill") as `${typeof item.icon}.fill`)
    : item.icon;
  return (
    <li className="flex justify-center">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        aria-label={item.label}
        className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl"
        style={{ color: active ? "var(--accent)" : "var(--text-2)" }}
      >
        <Sym name={iconName} size={24} />
        <span
          className="text-[10.5px] tracking-tight"
          style={{ fontWeight: active ? 700 : 500, whiteSpace: "nowrap" }}
        >
          {item.label}
        </span>
      </Link>
    </li>
  );
}
