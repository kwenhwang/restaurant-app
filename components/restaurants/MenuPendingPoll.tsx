"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  restaurantId: string;
}

/**
 * Shown when restaurant.menu is empty. Polls the server for menu updates
 * (auto-fetched in background after restaurant creation) and refreshes
 * the page when the menu appears.
 */
export default function MenuPendingPoll({ restaurantId }: Props) {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const checkUrl = `/api/restaurants/${restaurantId}/menu-status`;

    async function poll() {
      try {
        const res = await fetch(checkUrl, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.hasMenu) {
          router.refresh();
        }
      } catch {}
    }

    // 5s, 10s, 20s, 30s (then stop)
    const delays = [5000, 10000, 20000, 30000];
    if (tries >= delays.length) return;
    const timeout = setTimeout(() => {
      poll().then(() => setTries((t) => t + 1));
    }, delays[tries]);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [tries, restaurantId, router]);

  if (tries === 0) {
    return (
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-2 text-[13px]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,111,61,0.10), rgba(217,74,30,0.05))",
          boxShadow: "inset 0 0 0 0.5px var(--separator)",
          color: "var(--text-2)",
        }}
      >
        <span
          className="inline-block w-3 h-3 rounded-full border-2 shrink-0"
          style={{
            borderColor: "var(--accent)",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span>인터넷에서 메뉴 찾는 중… (잠시만요)</span>
        <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return null;
}
