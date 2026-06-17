// lib/rankings.ts
// Compute per-restaurant score and rank.
//
//   score = rating × 20 + min(visit_count, 10) × 2
//
// Rating dominates (max 100). Frequent visits cap at 20 to reward "safe
// staple" without letting them outrank higher-rated newer finds.
//
// Tiebreaker order: score desc → visit_count desc → created_at asc.

export interface Rankable {
  id: string;
  rating: number | null;
  visit_count: number;
  created_at?: string | null;
}

export function score(r: { rating: number | null; visit_count: number }): number {
  const rating = r.rating ?? 0;
  const visits = Math.min(r.visit_count ?? 0, 10);
  return rating * 20 + visits * 2;
}

/**
 * Elo-aware ranking: rows with an entry in `eloMap` sort first (by Elo desc),
 * then any score-less rows fall back to the legacy formula. Used wherever
 * we need a consistent rank across the user's restaurants since the
 * pairwise system was introduced.
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
