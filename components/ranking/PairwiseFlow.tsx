"use client";

// State machine for the post-capture / re-rank pairwise flow.
// Phases:
//   1. tier  — pick a tier bucket
//   2. round — up to N opponent compares
//   3. done  — friendly summary, then back to detail
//
// In `rerank` mode the tier step is skipped; the user goes straight to rounds.

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TierPicker from "./TierPicker";
import PairwiseRound from "./PairwiseRound";
import RankProgress from "./RankProgress";
import {
  setInitialTier,
  pickOpponents,
  recordComparison,
} from "@/app/(main)/restaurants/[id]/rank/actions";
import type { Tier } from "@/lib/pairwise";

interface SubjectLite {
  id: string;
  name: string;
  category: string | null;
  storage_path: string | null;
  blur_data_url?: string | null;
}

interface Opp {
  id: string;
  name: string;
  category: string | null;
  storage_path: string | null;
  blur_data_url?: string | null;
}

interface Props {
  subject: SubjectLite;
  mode: "capture" | "rerank";
  initialTier?: Tier | null;
}

const TOTAL_ROUNDS = 3;

export default function PairwiseFlow({ subject, mode, initialTier }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"tier" | "round" | "done">(
    mode === "rerank" || initialTier != null ? "round" : "tier",
  );
  const [opponents, setOpponents] = useState<Opp[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [opponentsLoaded, setOpponentsLoaded] = useState(false);

  async function loadOpponents() {
    const opps = await pickOpponents(subject.id, TOTAL_ROUNDS);
    setOpponents(opps);
    setOpponentsLoaded(true);
    if (opps.length === 0) {
      // Nothing to compare against — skip straight to done
      setPhase("done");
    }
  }

  // Auto-load opponents when we enter the round phase (rerank goes here
  // directly; capture goes here after the user picks a tier).
  useEffect(() => {
    if (phase === "round" && !opponentsLoaded) {
      loadOpponents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, opponentsLoaded]);

  function handleTier(tier: Tier) {
    setError(null);
    startTransition(async () => {
      const res = await setInitialTier(subject.id, tier);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setPhase("round");
      // useEffect will load opponents
    });
  }

  function handlePick(winnerId: string) {
    setError(null);
    const opp = opponents[roundIdx];
    const loserId = winnerId === subject.id ? opp.id : subject.id;
    startTransition(async () => {
      const res = await recordComparison(
        winnerId,
        loserId,
        mode === "rerank" ? "rerank" : "capture",
      );
      if ("error" in res) {
        setError(res.error);
        return;
      }
      advance();
    });
  }

  function handleSkip() {
    advance();
  }

  function advance() {
    if (roundIdx + 1 >= opponents.length) {
      setPhase("done");
    } else {
      setRoundIdx((i) => i + 1);
    }
  }


  return (
    <div className="px-[18px] pb-24 pt-4 space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href={`/restaurants/${subject.id}`}
          className="text-[14px] font-semibold"
          style={{ color: "var(--text-2)" }}
        >
          {phase === "done" ? "" : "건너뛰기"}
        </Link>
        {phase === "round" && opponents.length > 0 && (
          <RankProgress total={opponents.length} current={roundIdx + 1} />
        )}
        <span style={{ width: 60 }} />
      </div>

      {phase === "tier" && <TierPicker onPick={handleTier} pending={pending} />}

      {phase === "round" && opponents[roundIdx] && (
        <PairwiseRound
          subject={subject}
          opponent={opponents[roundIdx]}
          onPick={handlePick}
          onSkip={handleSkip}
          pending={pending}
        />
      )}

      {phase === "round" && !opponentsLoaded && (
        <div className="text-center mt-8" style={{ color: "var(--text-2)" }}>
          비교 후보를 불러오는 중…
        </div>
      )}

      {phase === "round" && opponentsLoaded && opponents.length === 0 && (
        <div className="text-center mt-8" style={{ color: "var(--text-2)" }}>
          비교할 다른 가게가 아직 없어요.
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-3 mt-8">
          <div className="text-[44px]">🎉</div>
          <h2 className="font-display text-[22px] font-extrabold">
            평가 완료
          </h2>
          <p className="text-[14px]" style={{ color: "var(--text-2)" }}>
            홈 화면의 순위에 반영됐어요.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/restaurants/${subject.id}`)}
            className="mt-3 h-12 px-6 rounded-full text-[15px] font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            가게로 돌아가기
          </button>
        </div>
      )}

      {error && (
        <p className="text-[12px] text-center" style={{ color: "#D14343" }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
