// components/restaurants/RankBadge.tsx
// Small pill shown on cards (top-right corner) and inline elsewhere.
// Hidden for ranks > 10 — the long tail clutter is the whole point.

import { rankTone } from "@/lib/rankings";

interface Props {
  rank: number;
  total?: number;
  variant?: "card" | "ribbon"; // card = absolute corner; ribbon = inline
}

export default function RankBadge({ rank, total, variant = "card" }: Props) {
  const tone = rankTone(rank);
  if (!tone) return null;

  const isGold = tone === "gold";
  const bg = isGold ? "rgba(193,154,61,0.14)" : "var(--accent-soft)";
  const fg = isGold ? "#C19A3D" : "var(--accent)";
  const label = isGold ? `TOP ${rank}` : `#${rank}`;

  if (variant === "ribbon") {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold"
        style={{ background: bg, color: fg, letterSpacing: 0.2 }}
      >
        <Star color={fg} />
        <span className="tabular-nums">
          내 맛집 중 {rank}위{total ? ` · 상위 ${percent(rank, total)}%` : ""}
        </span>
      </div>
    );
  }

  return (
    <div
      className="absolute top-2.5 right-2.5 px-2 py-[3px] rounded-full text-[10.5px] font-extrabold tabular-nums"
      style={{ background: bg, color: fg, letterSpacing: 0.2, zIndex: 1 }}
    >
      {label}
    </div>
  );
}

function Star({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={color}>
      <path d="M12 2.5l2.95 6.34 6.85.78-5.1 4.78 1.4 6.83L12 17.86l-6.1 3.37 1.4-6.83-5.1-4.78 6.85-.78L12 2.5z" />
    </svg>
  );
}

function percent(rank: number, total: number) {
  if (total <= 1) return 100;
  return Math.round(((total - rank) / (total - 1)) * 100);
}
