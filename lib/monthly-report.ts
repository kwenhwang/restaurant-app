// Aggregates one calendar month of activity for the monthly food report.
//
// Inputs: the user's restaurants (id, name, category, address, created_at,
// rating) + visits (restaurant_id, visited_at) — same shapes the home and
// profile pages already pull.
//
// Output: a single MonthlyReport object the page renders. Pure function,
// safe to memoize or run on the edge.

export interface RestaurantRow {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  rating: number | null;
  created_at?: string | null;
}

export interface VisitRow {
  restaurant_id: string;
  visited_at: string; // ISO date 'YYYY-MM-DD'
}

export interface MonthlyReport {
  yyyymm: string; // "2026-05"
  monthLabel: string; // "5월"
  startedAt: string;
  endedAt: string;
  hasData: boolean;
  /** Visits in the window */
  visits: number;
  /** Distinct restaurants visited in the window */
  uniqueRestaurants: number;
  /** Restaurants whose created_at falls in the window — "new finds" */
  newDiscoveries: number;
  /** revisits = visits − unique-only-visited-this-month-and-newly-created. */
  revisits: number;
  /** Category share { 한식: 3, 카페: 2, ... } */
  categoryShare: { category: string; count: number; emoji: string }[];
  /** Top-visited restaurants this month */
  topVisited: { id: string; name: string; category: string | null; visits: number }[];
  /** Favorite picks — 5★ rated restaurants from this month's new finds */
  favorites: { id: string; name: string; category: string | null }[];
  /** Most common 시/구 from addresses */
  topRegion: string | null;
  /** "Streak" — longest run of consecutive days with at least 1 visit */
  longestStreak: number;
  /** Average rating of restaurants visited this month (those with ratings) */
  averageRating: number | null;
}

const CATEGORY_EMOJI: Record<string, string> = {
  한식: "🍚",
  중식: "🥟",
  일식: "🍣",
  양식: "🍝",
  카페: "☕️",
  술집: "🍺",
  디저트: "🍰",
  기타: "🍽️",
};

function extractRegion(address: string): string | null {
  const m = address.match(/([가-힣]+(?:구|시))/);
  return m?.[1] ?? null;
}

function inMonth(dateISO: string | null | undefined, yyyymm: string): boolean {
  if (!dateISO) return false;
  return dateISO.startsWith(yyyymm);
}

export function buildMonthlyReport(opts: {
  yyyymm: string; // "2026-05"
  restaurants: RestaurantRow[];
  visits: VisitRow[];
}): MonthlyReport {
  const { yyyymm, restaurants, visits } = opts;
  const [yStr, mStr] = yyyymm.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  const startedAt = start.toISOString();
  const endedAt = end.toISOString();

  // Visits in the month
  const monthVisits = visits.filter((v) => v.visited_at && v.visited_at.startsWith(yyyymm));
  const visitsCount = monthVisits.length;

  // Visits → counts per restaurant
  const visitCountByRid = new Map<string, number>();
  for (const v of monthVisits) {
    visitCountByRid.set(v.restaurant_id, (visitCountByRid.get(v.restaurant_id) ?? 0) + 1);
  }
  const uniqueRestaurants = visitCountByRid.size;

  // Restaurant lookup
  const byId = new Map(restaurants.map((r) => [r.id, r]));

  // New discoveries — restaurants CREATED in this month
  const newDiscoveriesList = restaurants.filter((r) => inMonth(r.created_at ?? null, yyyymm));
  const newDiscoveriesCount = newDiscoveriesList.length;

  // Revisits — visits whose restaurant was created BEFORE this month
  const revisits = monthVisits.filter((v) => {
    const r = byId.get(v.restaurant_id);
    if (!r?.created_at) return false;
    return r.created_at < startedAt;
  }).length;

  // Category share of visited restaurants this month
  const catCount = new Map<string, number>();
  for (const rid of visitCountByRid.keys()) {
    const r = byId.get(rid);
    const c = r?.category ?? "기타";
    catCount.set(c, (catCount.get(c) ?? 0) + 1);
  }
  // Also include new discoveries even without a visit, so the month feels populated
  for (const r of newDiscoveriesList) {
    if (!visitCountByRid.has(r.id)) {
      const c = r.category ?? "기타";
      catCount.set(c, (catCount.get(c) ?? 0) + 1);
    }
  }
  const categoryShare = [...catCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      count,
      emoji: CATEGORY_EMOJI[category] ?? "🍽️",
    }));

  // Top visited
  const topVisited = [...visitCountByRid.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([rid, count]) => {
      const r = byId.get(rid);
      return {
        id: rid,
        name: r?.name ?? "(이름 없음)",
        category: r?.category ?? null,
        visits: count,
      };
    });

  // 5-star new finds
  const favorites = newDiscoveriesList
    .filter((r) => (r.rating ?? 0) >= 5)
    .map((r) => ({ id: r.id, name: r.name, category: r.category ?? null }))
    .slice(0, 5);

  // Region — visited restaurants only
  const regionCount = new Map<string, number>();
  for (const rid of visitCountByRid.keys()) {
    const r = byId.get(rid);
    const region = r?.address ? extractRegion(r.address) : null;
    if (region) regionCount.set(region, (regionCount.get(region) ?? 0) + 1);
  }
  const topRegion = [...regionCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Longest streak of days with visit
  const days = new Set(monthVisits.map((v) => v.visited_at).filter(Boolean));
  let longestStreak = 0;
  let cur = 0;
  const totalDays = end.getUTCDate();
  for (let d = 1; d <= totalDays; d++) {
    const iso = `${yyyymm}-${String(d).padStart(2, "0")}`;
    if (days.has(iso)) {
      cur += 1;
      if (cur > longestStreak) longestStreak = cur;
    } else {
      cur = 0;
    }
  }

  // Average rating of restaurants visited this month
  const ratings: number[] = [];
  for (const rid of visitCountByRid.keys()) {
    const r = byId.get(rid);
    if (r?.rating != null) ratings.push(r.rating);
  }
  const averageRating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;

  return {
    yyyymm,
    monthLabel: `${m}월`,
    startedAt,
    endedAt,
    hasData: visitsCount > 0 || newDiscoveriesCount > 0,
    visits: visitsCount,
    uniqueRestaurants,
    newDiscoveries: newDiscoveriesCount,
    revisits,
    categoryShare,
    topVisited,
    favorites,
    topRegion,
    longestStreak,
    averageRating,
  };
}

/**
 * Returns a list of YYYY-MM strings the user has activity in, most recent
 * first. Used by the report index.
 */
export function activeMonths(visits: VisitRow[], restaurants: RestaurantRow[]): string[] {
  const months = new Set<string>();
  for (const v of visits) {
    if (v.visited_at) months.add(v.visited_at.slice(0, 7));
  }
  for (const r of restaurants) {
    if (r.created_at) months.add(r.created_at.slice(0, 7));
  }
  return [...months].sort().reverse();
}
