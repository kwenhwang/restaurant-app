"use client";

import OpponentCard from "./OpponentCard";
import { haptic } from "@/lib/haptic";

interface Opp {
  id: string;
  name: string;
  category: string | null;
  storage_path: string | null;
  blur_data_url?: string | null;
}

interface Props {
  subject: Opp;
  opponent: Opp;
  onPick: (winnerId: string) => void;
  onSkip: () => void;
  pending?: boolean;
}

export default function PairwiseRound({ subject, opponent, onPick, onSkip, pending }: Props) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-display text-[22px] font-extrabold">어느 게 더 좋아?</h2>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-2)" }}>
          더 좋아하는 가게의 사진을 탭하세요
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 items-stretch">
        <OpponentCard
          {...subject}
          onClick={() => {
            if (pending) return;
            haptic("medium");
            onPick(subject.id);
          }}
          disabled={pending}
        />
        <OpponentCard
          {...opponent}
          onClick={() => {
            if (pending) return;
            haptic("medium");
            onPick(opponent.id);
          }}
          disabled={pending}
        />
      </div>

      <div className="text-center">
        <span className="font-display text-[28px] font-black" style={{ color: "var(--text-3)" }}>
          VS
        </span>
      </div>

      <button
        type="button"
        onClick={onSkip}
        disabled={pending}
        className="w-full h-11 rounded-full text-[13px] font-semibold disabled:opacity-50"
        style={{ background: "var(--surface)", color: "var(--text-2)", boxShadow: "var(--shadow-1)" }}
      >
        비교 못 하겠어요
      </button>
    </div>
  );
}
