// Tier-bucketed Elo for the Beli-style pairwise ranking.
//
// Each user maintains a private score table (restaurant_scores). The tier
// (좋아함/괜찮음/별로) sets an initial Elo and bucket; subsequent A vs B
// comparisons update Elo within (and across) buckets.

export type Tier = 0 | 1 | 2; // 0=좋아함, 1=괜찮음, 2=별로

export const TIER_LABEL: Record<Tier, string> = {
  0: "좋아함",
  1: "괜찮음",
  2: "별로",
};

export const TIER_EMOJI: Record<Tier, string> = {
  0: "🟢",
  1: "🟡",
  2: "🔴",
};

const TIER_INITIAL_ELO: Record<Tier, number> = {
  0: 1300,
  1: 1000,
  2: 700,
};

export function tierInitialElo(tier: Tier): number {
  return TIER_INITIAL_ELO[tier];
}

/**
 * Update Elo after a comparison. Returns the new (winner, loser) Elo pair.
 * Caller is responsible for atomically persisting both with comparisons_count
 * increment.
 *
 * K is higher (48) while the user is still building a rating signal (under
 * 5 comparisons total for the winning row), then drops to 24 to stabilize.
 */
export function eloUpdate(opts: {
  winnerElo: number;
  loserElo: number;
  winnerComparisons: number;
}): { winner: number; loser: number; delta: number } {
  const { winnerElo, loserElo, winnerComparisons } = opts;
  const K = winnerComparisons < 5 ? 48 : 24;
  const expectedW = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const delta = K * (1 - expectedW);
  return {
    winner: winnerElo + delta,
    loser: loserElo - delta,
    delta,
  };
}

/**
 * Re-tiering shifts a restaurant's Elo by half the gap between the old and
 * new tier baselines — keeps prior comparison signal partly intact.
 */
export function retierElo(currentElo: number, oldTier: Tier | null, newTier: Tier): number {
  const oldBase = oldTier == null ? 1000 : tierInitialElo(oldTier);
  const newBase = tierInitialElo(newTier);
  return currentElo + (newBase - oldBase) * 0.5;
}
