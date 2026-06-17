"use client";

import { TIER_LABEL, TIER_EMOJI, type Tier } from "@/lib/pairwise";

interface Props {
  initial?: Tier;
  onPick: (tier: Tier) => void;
  pending?: boolean;
}

const TIERS: { tier: Tier; bg: string; description: string }[] = [
  { tier: 0, bg: "linear-gradient(150deg, #C8F2D5, #59C77F)", description: "또 가고 싶어요" },
  { tier: 1, bg: "linear-gradient(150deg, #FFE9C2, #F0AE3A)", description: "그럭저럭" },
  { tier: 2, bg: "linear-gradient(150deg, #FFD0CC, #D8514A)", description: "다시는 안 갈래요" },
];

export default function TierPicker({ initial, onPick, pending }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <h2 className="font-display text-[24px] font-extrabold">이 가게 어땠어?</h2>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-2)" }}>
          한 번만 골라두면 순위에 반영돼요
        </p>
      </div>
      <div className="space-y-2.5">
        {TIERS.map(({ tier, bg, description }) => (
          <button
            key={tier}
            type="button"
            onClick={() => !pending && onPick(tier)}
            disabled={pending}
            className="w-full rounded-2xl p-4 text-left transition-transform active:scale-[0.98]"
            style={{
              background: bg,
              boxShadow: "var(--shadow-1)",
              border: initial === tier ? "3px solid var(--text)" : "3px solid transparent",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-[42px]">{TIER_EMOJI[tier]}</span>
              <div>
                <div className="font-display text-[20px] font-extrabold text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                  {TIER_LABEL[tier]}
                </div>
                <div className="text-[12.5px] font-semibold text-white opacity-95">
                  {description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
