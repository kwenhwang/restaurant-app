"use client";

interface Props {
  total: number;
  current: number; // 1-indexed
}

export default function RankProgress({ total, current }: Props) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
        const filled = n <= current;
        return (
          <span
            key={n}
            className="block rounded-full transition-all"
            style={{
              width: n === current ? 18 : 6,
              height: 6,
              background: filled ? "var(--accent)" : "var(--separator)",
            }}
          />
        );
      })}
    </div>
  );
}
