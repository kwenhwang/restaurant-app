/**
 * Re-visit candidate selection.
 *
 * Surfaces restaurants the user liked but hasn't been to recently.
 * Pure function over the already-decorated home-page list — no extra
 * query needed.
 *
 * Score by:
 * - 즐겨찾기: +60
 * - rating >= 4: +25
 * - rating == 5: +10 extra
 * - days since last visit / 30: +1 per month, capped at +24 (2 years)
 * - never visited (we have it but never logged): treat as 60 days
 *
 * Threshold: must have favorite OR rating >= 4 AND >= 30 days since last visit.
 *
 * Returns up to N candidates sorted by score descending.
 */

export interface RevisitInput {
  id: string;
  name: string;
  category?: string | null;
  rating?: number | null;
  is_favorite?: boolean | null;
  last_visit?: string | null;
  images?: { id: string; storage_path: string; is_primary?: boolean | null }[];
}

export interface RevisitCandidate {
  id: string;
  name: string;
  category: string | null;
  rating: number | null;
  is_favorite: boolean;
  days_since: number; // days since last visit; 9999 if never
  storage_path: string | null;
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
    const rating = r.rating ?? 0;
    if (!favorite && rating < 4) continue;

    let daysSince: number;
    if (r.last_visit) {
      const last = new Date(r.last_visit + "T00:00:00");
      daysSince = Math.floor((todayMs - last.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      daysSince = NEVER_VISITED_FALLBACK_DAYS;
    }
    if (daysSince < MIN_DAYS_THRESHOLD) continue;

    let score = 0;
    if (favorite) score += 60;
    if (rating >= 4) score += 25;
    if (rating === 5) score += 10;
    score += Math.min(24, Math.floor(daysSince / 30));

    const primary = r.images?.find((i) => i.is_primary) ?? r.images?.[0];

    candidates.push({
      id: r.id,
      name: r.name,
      category: r.category ?? null,
      rating: r.rating ?? null,
      is_favorite: favorite,
      days_since: daysSince,
      storage_path: primary?.storage_path ?? null,
      score,
    });
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
