/**
 * Re-visit candidate selection.
 *
 * Surfaces restaurants the user wants to come back to OR places they've
 * wished for but never visited. Pure function over the already-decorated
 * home-page list — no extra query needed.
 *
 * Score by:
 * - 즐겨찾기: +60
 * - tier 0 (좋아함): +35, tier 1: +5
 * - wishlist (zero visits, member of "가고 싶은 곳"): +45
 * - days since last visit / 30: +1 per month, capped at +24 (2 years)
 *
 * Threshold: favorite OR tier 0 OR is_wishlist, with appropriate age gate.
 * Wishlist items become candidates immediately (no 30-day wait).
 *
 * Returns up to N candidates sorted by score descending.
 */

export interface RevisitInput {
  id: string;
  name: string;
  category?: string | null;
  tier?: 0 | 1 | 2 | null;
  is_favorite?: boolean | null;
  is_wishlist?: boolean | null;
  last_visit?: string | null;
  images?: { id: string; storage_path: string; is_primary?: boolean | null; blur_data_url?: string | null }[];
}

export interface RevisitCandidate {
  id: string;
  name: string;
  category: string | null;
  tier: 0 | 1 | 2 | null;
  is_favorite: boolean;
  is_wishlist: boolean;
  /** Days since last visit, or 9999 for wishlist items that have never been visited. */
  days_since: number;
  storage_path: string | null;
  blur_data_url: string | null;
  score: number;
}

const NEVER_VISITED_FALLBACK_DAYS = 60;
const MIN_DAYS_THRESHOLD = 30;

export function pickRevisitCandidates(
  restaurants: RevisitInput[],
  limit = 3,
): RevisitCandidate[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const candidates: RevisitCandidate[] = [];

  for (const r of restaurants) {
    const favorite = !!r.is_favorite;
    const wishlist = !!r.is_wishlist;
    const tier = r.tier ?? null;
    const everVisited = !!r.last_visit;

    // Wishlist (never visited) → always eligible.
    // Visited favorites / tier 0 (좋아함) → eligible only if 30+ days since last visit.
    if (wishlist && !everVisited) {
      // pass
    } else if (favorite || tier === 0) {
      // pass
    } else {
      continue;
    }

    let daysSince: number;
    if (r.last_visit) {
      const last = new Date(r.last_visit + "T00:00:00");
      daysSince = Math.floor((todayMs - last.getTime()) / (1000 * 60 * 60 * 24));
    } else if (wishlist) {
      // Wishlist with no visits — we treat days_since as "high" so the
      // urgency ramps the longer it sits in the list.
      daysSince = 9999;
    } else {
      daysSince = NEVER_VISITED_FALLBACK_DAYS;
    }

    // Visited candidates still need to be stale (30+ days).
    if (everVisited && daysSince < MIN_DAYS_THRESHOLD) continue;

    let score = 0;
    if (favorite) score += 60;
    if (tier === 0) score += 35;
    else if (tier === 1) score += 5;
    if (wishlist) score += 45;
    score += Math.min(24, Math.floor(daysSince / 30));

    const primary = r.images?.find((i) => i.is_primary) ?? r.images?.[0];

    candidates.push({
      id: r.id,
      name: r.name,
      category: r.category ?? null,
      tier,
      is_favorite: favorite,
      is_wishlist: wishlist,
      days_since: daysSince,
      storage_path: primary?.storage_path ?? null,
      blur_data_url: primary?.blur_data_url ?? null,
      score,
    });
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
