/**
 * Helpers for the shared place_menus / place_reviews cache.
 *
 * Different users adding the same restaurant share the AI-fetched menu and
 * blog-review summary. Keying is by normalized name + lat/lng bucket so
 * minor variations of the same place collapse into one cache row.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

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

export type CacheTable = "place_menus" | "place_reviews";
export type CacheStatus = "ok" | "not_found" | "error";

export interface ReadResult<TPayload> {
  fresh: boolean;
  status: CacheStatus | null;
  payload: TPayload | null;
}

/**
 * Look up a cache row by normalized name + lat/lng bucket. Returns
 * `fresh=false` if the row is missing or older than the appropriate TTL.
 *
 * The payload column ("menu" or "reviews") is inferred from the table name.
 */
export async function readPlaceCache<TPayload>(opts: {
  admin: SupabaseClient;
  table: CacheTable;
  name: string;
  lat: number | null;
  lng: number | null;
  okTtlMs: number;
  negTtlMs: number;
}): Promise<ReadResult<TPayload>> {
  const payloadCol = opts.table === "place_menus" ? "menu" : "reviews";
  const nameKey = normalizeName(opts.name);
  const { latBucket, lngBucket } = bucketCoord(opts.lat, opts.lng);

  let q = opts.admin
    .from(opts.table)
    .select(`${payloadCol}, fetch_status, last_fetched_at`)
    .eq("name_normalized", nameKey);
  if (latBucket !== null) {
    q = q.eq("lat_bucket", latBucket).eq("lng_bucket", lngBucket);
  } else {
    q = q.is("lat_bucket", null).is("lng_bucket", null);
  }
  const { data } = await q.maybeSingle();

  if (!data) return { fresh: false, status: null, payload: null };

  const status = (data.fetch_status ?? null) as CacheStatus | null;
  const ageMs = data.last_fetched_at
    ? Date.now() - new Date(data.last_fetched_at as string).getTime()
    : Infinity;
  const ttl = status === "ok" ? opts.okTtlMs : opts.negTtlMs;
  const fresh = ageMs < ttl;
  const payload = (data as Record<string, unknown>)[payloadCol] as TPayload | null;

  return { fresh, status, payload };
}

/**
 * Upsert a cache row. Pass `status: 'not_found'` or `'error'` with
 * `payload: null` for negative caches.
 */
export async function writePlaceCache(opts: {
  admin: SupabaseClient;
  table: CacheTable;
  name: string;
  displayName: string;
  lat: number | null;
  lng: number | null;
  status: CacheStatus;
  payload: unknown | null;
}): Promise<void> {
  const payloadCol = opts.table === "place_menus" ? "menu" : "reviews";
  const nameKey = normalizeName(opts.name);
  const { latBucket, lngBucket } = bucketCoord(opts.lat, opts.lng);
  const now = new Date().toISOString();

  await opts.admin.from(opts.table).upsert(
    {
      name_normalized: nameKey,
      lat_bucket: latBucket,
      lng_bucket: lngBucket,
      display_name: opts.displayName,
      [payloadCol]: opts.payload,
      fetch_status: opts.status,
      last_fetched_at: now,
      updated_at: now,
    },
    { onConflict: "name_normalized,lat_bucket,lng_bucket" },
  );
}
