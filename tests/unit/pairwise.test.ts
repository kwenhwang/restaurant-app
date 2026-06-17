import { describe, it, expect } from "vitest";
import { eloUpdate, retierElo, tierInitialElo, TIER_LABEL, TIER_EMOJI } from "@/lib/pairwise";

describe("pairwise — Elo", () => {
  it("higher-rated winner gains less than upset winner", () => {
    // Equal Elo — winner gains K/2 (24 with K=48 for new player)
    const equal = eloUpdate({ winnerElo: 1000, loserElo: 1000, winnerComparisons: 0 });
    expect(equal.winner).toBeCloseTo(1024, 0);
    expect(equal.loser).toBeCloseTo(976, 0);

    // Upset (low Elo beats high Elo) — winner gains more
    const upset = eloUpdate({ winnerElo: 800, loserElo: 1300, winnerComparisons: 0 });
    expect(upset.delta).toBeGreaterThan(equal.delta);

    // Expected win (high Elo beats low Elo) — winner gains less
    const expected = eloUpdate({ winnerElo: 1500, loserElo: 800, winnerComparisons: 0 });
    expect(expected.delta).toBeLessThan(equal.delta);
  });

  it("K-factor drops from 48 to 24 after 5 comparisons", () => {
    const novice = eloUpdate({ winnerElo: 1000, loserElo: 1000, winnerComparisons: 0 });
    const seasoned = eloUpdate({ winnerElo: 1000, loserElo: 1000, winnerComparisons: 5 });
    expect(novice.delta).toBeGreaterThan(seasoned.delta);
    expect(seasoned.delta).toBeCloseTo(12, 0); // 24 / 2 with equal Elo
  });

  it("zero-sum: winner gain == loser loss", () => {
    const r = eloUpdate({ winnerElo: 900, loserElo: 1100, winnerComparisons: 3 });
    expect(r.winner - 900).toBeCloseTo(1100 - r.loser, 6);
  });
});

describe("pairwise — tier", () => {
  it("tier baselines are 좋아함 1300 / 괜찮음 1000 / 별로 700", () => {
    expect(tierInitialElo(0)).toBe(1300);
    expect(tierInitialElo(1)).toBe(1000);
    expect(tierInitialElo(2)).toBe(700);
  });

  it("retier preserves half the prior signal", () => {
    // tier 0→2: baseline 1300 → 700 (delta -600). Shift = -300.
    // If user was at 1400 in tier 0, retiering to tier 2 should put them at 1100.
    expect(retierElo(1400, 0, 2)).toBe(1100);
    // Same magnitude upward
    expect(retierElo(700, 2, 0)).toBe(1000);
  });

  it("retier from null tier uses 1000 baseline", () => {
    expect(retierElo(1000, null, 0)).toBe(1150); // shift = (1300-1000)/2 = 150
  });

  it("tier labels + emoji are present for 0/1/2", () => {
    expect(TIER_LABEL[0]).toBeTruthy();
    expect(TIER_LABEL[1]).toBeTruthy();
    expect(TIER_LABEL[2]).toBeTruthy();
    expect(TIER_EMOJI[0]).toMatch(/[🟢🟡🔴]/);
  });
});
