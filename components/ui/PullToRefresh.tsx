"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const TRIGGER = 80;
const MAX_PULL = 120;

export default function PullToRefresh() {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const isPulling = useRef(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!isPulling.current || startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      if (window.scrollY > 0) {
        isPulling.current = false;
        setPull(0);
        return;
      }
      // Rubber-band feel
      const eased = Math.min(MAX_PULL, dy * 0.5);
      setPull(eased);
    }

    function onTouchEnd() {
      if (!isPulling.current) return;
      isPulling.current = false;
      startY.current = null;
      if (pull >= TRIGGER) {
        setRefreshing(true);
        setPull(TRIGGER);
        router.refresh();
        // Reset shortly; router.refresh is fire-and-forget
        setTimeout(() => {
          setRefreshing(false);
          setPull(0);
        }, 600);
      } else {
        setPull(0);
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [pull, router]);

  if (pull === 0 && !refreshing) return null;

  const progress = Math.min(1, pull / TRIGGER);
  const rotation = refreshing ? "infinite" : `${progress * 360}deg`;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{
        transform: `translateY(${pull}px)`,
        transition: refreshing || pull === 0 ? "transform 200ms" : "none",
      }}
    >
      <div
        className="mt-2 w-9 h-9 rounded-full bg-white flex items-center justify-center"
        style={{
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          opacity: progress,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: "var(--accent)",
            transform: refreshing ? undefined : `rotate(${rotation})`,
            animation: refreshing ? "ptr-spin 0.6s linear infinite" : undefined,
          }}
        >
          <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9z" opacity="0.2" />
          <path d="M21 12a9 9 0 0 0-9-9" />
        </svg>
      </div>
      <style>{`
        @keyframes ptr-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
