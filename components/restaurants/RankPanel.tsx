// components/restaurants/RankPanel.tsx
// Detail-page rank visualization: ribbon + RankBar + contextual sentence.

import RankBadge from "./RankBadge";
import { percentile } from "@/lib/rankings";

interface Props {
  rank: number;
  total: number;
  categoryRank?: number;          // rank within category
  categoryTotal?: number;         // total in category
  category?: string | null;
}

export default function RankPanel({
  rank,
  total,
  categoryRank,
  categoryTotal,
  category,
}: Props) {
  if (total < 2) return null; // no rank context to show when only 1 restaurant

  const pct = percentile(rank, total);
  const barPct = total > 1 ? ((total - rank) / (total - 1)) * 100 : 100;

  // Story line tries to give the rank meaning ("한식 중 1위" beats a number).
  const story =
    categoryRank && categoryTotal && categoryTotal >= 2
      ? `${category} 카테고리 ${categoryTotal}곳 중에서는 ${categoryRank}위`
      : rank === 1
      ? "지금 내가 가장 좋아하는 곳"
      : `상위 ${pct}%에 들어요`;

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--surface)" }}>
      <div className="flex justify-between items-baseline mb-2.5">
        <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
          전체 <span className="tabular-nums">{total}</span>곳 중
        </div>
        <RankBadge rank={rank} total={total} variant="ribbon" />
      </div>

      {/* RankBar */}
      <div className="relative h-3 rounded-full overflow-visible"
        style={{
          background:
            "linear-gradient(to right, rgba(193,154,61,0.5) 0%, rgba(255,111,61,0.35) 33%, var(--separator) 66%, var(--text-3) 100%)",
        }}
      >
        <div
          className="absolute -top-[3px] w-[18px] h-[18px] rounded-full"
          style={{
            left: `calc(${barPct}% - 9px)`,
            background: rank <= 3 ? "#C19A3D" : "var(--accent)",
            boxShadow:
              "0 2px 6px rgba(0,0,0,0.18), 0 0 0 3px var(--surface)",
          }}
        />
      </div>

      <div
        className="flex justify-between mt-2 text-[10px] tabular-nums"
        style={{ color: "var(--text-3)" }}
      >
        <span>최고 1위</span>
        <span>중간 {Math.ceil(total / 2)}위</span>
        <span>최하 {total}위</span>
      </div>

      <div
        className="mt-3.5 px-3 py-2.5 rounded-[10px] text-[12.5px] leading-relaxed"
        style={{ background: "var(--accent-soft)", color: "var(--text)" }}
      >
        {story}
      </div>
    </div>
  );
}
