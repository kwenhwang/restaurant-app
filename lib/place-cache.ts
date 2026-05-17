/**
 * Helpers for the shared place_menus cache.
 * Different users adding the same restaurant share AI-fetched menus.
 */

export function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    // Strip common branch-name suffixes
    .replace(/\s*(점|지점|본점|매장|역점|중앙점)\s*$/, "")
    .toLowerCase();
}

/**
 * Round coordinates to ~11m precision (4 decimal places).
 * Two restaurants within this bucket are treated as the same place.
 */
export function bucketCoord(lat: number | null | undefined, lng: number | null | undefined) {
  if (lat == null || lng == null) return { latBucket: null, lngBucket: null };
  return {
    latBucket: Math.round(lat * 10000) / 10000,
    lngBucket: Math.round(lng * 10000) / 10000,
  };
}
