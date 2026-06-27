/**
 * Re-visit candidate selection.
 *
 * Surfaces restaurants the user wants to come back to OR places they've
 * wished for but never visited. Pure function over the already-decorated
 * home-page list — no extra query needed.
 *
 * Score by:
 * - 즐겨찾기: +60
 * - rating >= 4: +25, +10 extra if 5
 * - wishlist (zero visits, member of "가고 싶은 곳"): +45
 * - days since last visit / 30: +1 per month, capped at +24 (2 years)
 *
 * Threshold: favorite OR rating>=4 OR is_wishlist, with appropriate age gate.
 * Wishlist items become candidates immediately (no 30-day wait).
 *
 * Returns up to N candidates sorted by score descending.
 */

export interface RevisitInput {
  id: string;
  name: string;
  category?: string | null;
  rating?: number | null;
  is_favorite?: boolean | null;
  is_wishlist?: boolean | null;
  last_visit?: string | null;
  images?: { id: string; storage_path: string; is_primary?: boolean | null; blur_data_url?: string | null }[];
}

export interface RevisitCandidate {
  id: string;
  name: string;
  category: string | null;
  rating: number | null;
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
    const rating = r.rating ?? 0;
    const everVisited = !!r.last_visit;

    // Wishlist (never visited) → always eligible.
    // Visited favorites / 4+★ → eligible only if 30+ days since last visit.
    if (wishlist && !everVisited) {
      // pass
    } else if (favorite || rating >= 4) {
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
    if (rating >= 4) score += 25;
    if (rating === 5) score += 10;
    if (wishlist) score += 45;
    score += Math.min(24, Math.floor(daysSince / 30));

    const primary = r.images?.find((i) => i.is_primary) ?? r.images?.[0];

    candidates.push({
      id: r.id,
      name: r.name,
      category: r.category ?? null,
      rating: r.rating ?? null,
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
