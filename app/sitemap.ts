import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

// Refresh once an hour — new places added between deploys still get indexed.
export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatlog.duckdns.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient();

  // Pull all OK-cached places (menu and reviews tables)
  const [{ data: menus }, { data: reviews }] = await Promise.all([
    admin
      .from("place_menus")
      .select("display_name, lat_bucket, lng_bucket, updated_at")
      .eq("fetch_status", "ok"),
    admin
      .from("place_reviews")
      .select("display_name, lat_bucket, lng_bucket, updated_at")
      .eq("fetch_status", "ok"),
  ]);

  // Merge by (name, lat, lng) — same row appears in both tables, dedupe.
  const map = new Map<
    string,
    { name: string; lat: number | null; lng: number | null; lastMod: string }
  >();
  for (const row of [...(menus ?? []), ...(reviews ?? [])]) {
    const lat = row.lat_bucket as number | null;
    const lng = row.lng_bucket as number | null;
    const key = `${row.display_name}|${lat ?? ""}|${lng ?? ""}`;
    const updated = row.updated_at as string;
    const existing = map.get(key);
    if (!existing || updated > existing.lastMod) {
      map.set(key, { name: row.display_name, lat, lng, lastMod: updated });
    }
  }

  const placeEntries: MetadataRoute.Sitemap = [...map.values()].map((p) => {
    const query = p.lat != null && p.lng != null ? `?at=${p.lat},${p.lng}` : "";
    return {
      url: `${BASE}/place/${encodeURIComponent(p.name)}${query}`,
      lastModified: p.lastMod,
      changeFrequency: "weekly",
      priority: 0.7,
    };
  });

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/billing/upgrade`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/legal/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/legal/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [...staticEntries, ...placeEntries];
}
