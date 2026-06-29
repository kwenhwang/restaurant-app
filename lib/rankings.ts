// lib/rankings.ts
// 별점 폐지 후 — Elo가 1차 신호, tier가 2차 fallback, 방문 횟수가 약한 보너스.
//
//   score = tierWeight × 20 + min(visit_count, 10) × 2
//
//   tierWeight: 좋아함 0 → 5, 괜찮음 1 → 3, 별로 2 → 1, 평가 전 → 2.5
//
// Elo가 있으면 무조건 그 순서. Elo 없는 가게만 score로 폴백.
// Tiebreaker: score desc → visit_count desc → created_at asc.

export type Tier = 0 | 1 | 2 | null | undefined;

export interface Rankable {
  id: string;
  tier?: Tier;
  visit_count: number;
  created_at?: string | null;
}

function tierWeight(t: Tier): number {
  if (t == null) return 2.5;
  if (t === 0) return 5;
  if (t === 1) return 3;
  return 1; // tier 2 별로
}

export function score(r: { tier?: Tier; visit_count: number }): number {
  const visits = Math.min(r.visit_count ?? 0, 10);
  return tierWeight(r.tier) * 20 + visits * 2;
}

/**
 * Elo-aware ranking: rows with an entry in `eloMap` sort first (by Elo desc),
 * then any score-less rows fall back to the tier-based formula.
 */
export function rankAllByElo(
  restaurants: Rankable[],
  eloMap: Map<string, number>,
): Map<string, number> {
  const sorted = [...restaurants].sort((a, b) => {
    const aElo = eloMap.get(a.id);
    const bElo = eloMap.get(b.id);
    if (aElo != null && bElo != null) {
      if (aElo !== bElo) return bElo - aElo;
    } else if (aElo != null) {
      return -1;
    } else if (bElo != null) {
      return 1;
    }
    const ds = score(b) - score(a);
    if (ds !== 0) return ds;
    const dv = (b.visit_count ?? 0) - (a.visit_count ?? 0);
    if (dv !== 0) return dv;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
  const m = new Map<string, number>();
  sorted.forEach((r, i) => m.set(r.id, i + 1));
  return m;
}

/** Returns a Map<restaurant_id, rank> where rank starts at 1 (best). */
export function rankAll(restaurants: Rankable[]): Map<string, number> {
  const sorted = [...restaurants].sort((a, b) => {
    const ds = score(b) - score(a);
    if (ds !== 0) return ds;
    const dv = (b.visit_count ?? 0) - (a.visit_count ?? 0);
    if (dv !== 0) return dv;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
  const m = new Map<string, number>();
  sorted.forEach((r, i) => m.set(r.id, i + 1));
  return m;
}

/** Top X% — `1` = best. Returns 100 when total is 1 (always top). */
export function percentile(rank: number, total: number): number {
  if (total <= 1) return 100;
  return Math.round(((total - rank) / (total - 1)) * 100);
}

/** Tone hint for visual rank treatments on cards/badges. */
export function rankTone(rank: number): "gold" | "accent" | "muted" | null {
  if (rank <= 3) return "gold";
  if (rank <= 10) return "accent";
  return null; // hide for the long tail
}
