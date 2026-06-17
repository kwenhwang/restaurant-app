// Dynamic OG image for /place/[name]. Renders a 1200x630 card with the
// restaurant name + AI-summarized one-liner, suitable for Kakao/Twitter
// share previews.

import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeName, bucketCoord } from "@/lib/place-cache";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "eatlog 가게 카드";

interface Props {
  params: { name: string };
  searchParams?: { at?: string };
}

interface Menu {
  summary?: string;
  price_range?: string | null;
}
interface Reviews {
  summary?: string;
}

export default async function OGImage({ params, searchParams }: Props) {
  const admin = createAdminClient();
  const nameKey = normalizeName(decodeURIComponent(params.name));

  // Parse coords from ?at=lat,lng
  let lat: number | null = null;
  let lng: number | null = null;
  const at = searchParams?.at;
  if (at) {
    const [a, b] = at.split(",");
    const pa = parseFloat(a);
    const pb = parseFloat(b);
    if (isFinite(pa) && isFinite(pb)) {
      lat = pa;
      lng = pb;
    }
  }
  const { latBucket, lngBucket } = bucketCoord(lat, lng);

  // Pull menu summary
  let menuQ = admin
    .from("place_menus")
    .select("display_name, menu")
    .eq("name_normalized", nameKey)
    .eq("fetch_status", "ok");
  if (latBucket !== null) {
    menuQ = menuQ.eq("lat_bucket", latBucket).eq("lng_bucket", lngBucket);
  }
  const { data: menus } = await menuQ;
  const menuRow = menus?.[0];

  // Reviews summary
  let revQ = admin
    .from("place_reviews")
    .select("display_name, reviews")
    .eq("name_normalized", nameKey)
    .eq("fetch_status", "ok");
  if (latBucket !== null) {
    revQ = revQ.eq("lat_bucket", latBucket).eq("lng_bucket", lngBucket);
  }
  const { data: revs } = await revQ;
  const revRow = revs?.[0];

  const displayName =
    menuRow?.display_name ?? revRow?.display_name ?? decodeURIComponent(params.name);
  const summary =
    (revRow?.reviews as Reviews | null)?.summary ??
    (menuRow?.menu as Menu | null)?.summary ??
    "AI가 정리한 메뉴와 블로그 후기";
  const priceRange = (menuRow?.menu as Menu | null)?.price_range;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #F2622E 0%, #C8421A 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 3, opacity: 0.9 }}>
            EATLOG
          </div>
          <div
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.18)",
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            맛집 카드
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2,
              textShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            {displayName}
          </div>
          <div style={{ fontSize: 32, fontWeight: 500, opacity: 0.96, lineHeight: 1.4 }}>
            {summary.slice(0, 80)}
          </div>
          {priceRange && (
            <div style={{ fontSize: 26, fontWeight: 700, opacity: 0.95 }}>
              💰 {priceRange}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 18,
            borderTop: "1px solid rgba(255,255,255,0.3)",
            fontSize: 22,
            opacity: 0.95,
          }}
        >
          <span>📸 사진 한 장으로 시작하는 미식 일지</span>
          <span style={{ fontWeight: 700 }}>eatlog.duckdns.org</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
