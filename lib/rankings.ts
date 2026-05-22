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
