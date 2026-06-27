"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Sym from "@/components/ui/Sym";

// Sheet code (Kakao search + Korean category map) only needs to load once the
// user actually taps the wish button — saves ~5KB on the home page first paint.
const QuickWishSheet = dynamic(() => import("./QuickWishSheet"), { ssr: false });

export default function QuickWishButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="가고 싶은 곳 찜하기"
        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
        style={{
          background: "var(--surface)",
          boxShadow: "var(--shadow-1)",
        }}
      >
        <span style={{ fontSize: 18 }}>🔖</span>
      </button>
      <QuickWishSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
