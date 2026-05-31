"use client";

// components/restaurants/RestaurantStickyHeader.tsx — v3 (D1)
// Compact bar that sticks to the top of the detail page and fades in once the
// magazine hero scrolls past. Purely navigational (back), so it touches no
// server logic. The hero keeps its own glass back + actions menu for the
// un-scrolled state.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sym from "@/components/ui/Sym";

export default function RestaurantStickyHeader({ name }: { name: string }) {
  const [shown, setShown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 220);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[640px] flex items-center gap-3 px-3"
      style={{
        height: 56,
        pointerEvents: shown ? "auto" : "none",
        background: shown ? "color-mix(in srgb, var(--surface) 82%, transparent)" : "transparent",
        backdropFilter: shown ? "blur(18px) saturate(180%)" : "none",
        WebkitBackdropFilter: shown ? "blur(18px) saturate(180%)" : "none",
        borderBottom: `0.5px solid ${shown ? "var(--separator)" : "transparent"}`,
        transition: "background .25s, border-color .25s",
      }}
    >
      <button
        type="button"
        onClick={() => router.push("/")}
        aria-label="뒤로"
        className="w-[38px] h-[38px] rounded-full flex items-center justify-center"
        style={{
          opacity: shown ? 1 : 0,
          background: "var(--bg-2)",
          color: "var(--text)",
          transition: "opacity .25s",
        }}
      >
        <Sym name="chevron.left" size={19} />
      </button>
      <span
        className="font-display text-[17px] font-extrabold truncate"
        style={{
          opacity: shown ? 1 : 0,
          transform: shown ? "none" : "translateY(4px)",
          transition: "all .25s",
        }}
      >
        {name}
      </span>
    </div>
  );
}
