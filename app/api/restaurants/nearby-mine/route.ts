import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the user's restaurants within `radius` meters of (lat,lng).
 * Used by the capture flow to detect "re-visits" — same place already in the user's list.
 */
function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const lat = parseFloat(sp.get("lat") ?? "");
  const lng = parseFloat(sp.get("lng") ?? "");
  const radius = Math.min(2000, parseInt(sp.get("radius") ?? "300", 10) || 300);
  if (!isFinite(lat) || !isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }

  // Conservative bounding box for lat/lng (1 deg lat ≈ 111km)
  const latDelta = radius / 111000;
  const lngDelta = radius / (111000 * Math.cos((lat * Math.PI) / 180));

  const { data } = await supabase
    .from("restaurants")
    .select("id, name, address, lat, lng, category, is_favorite, images:restaurant_images(id, storage_path, is_primary, blur_data_url)")
    .eq("user_id", user.id)
    .not("lat", "is", null)
    .gte("lat", lat - latDelta)
    .lte("lat", lat + latDelta)
    .gte("lng", lng - lngDelta)
    .lte("lng", lng + lngDelta);

  const within = (data ?? [])
    .map((r) => ({ ...r, distance: haversine(lat, lng, r.lat!, r.lng!) }))
    .filter((r) => r.distance <= radius)
    .sort((a, b) => a.distance - b.distance);

  return NextResponse.json({ results: within });
}
