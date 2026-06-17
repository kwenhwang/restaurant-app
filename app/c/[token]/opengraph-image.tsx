// Dynamic OG image for /c/[token] — shared public collection.

import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "eatlog 컬렉션 카드";

export default async function OGImage({ params }: { params: { token: string } }) {
  const admin = createAdminClient();
  const { data: collection } = await admin
    .from("collections")
    .select("name, description, item_count")
    .eq("share_token", params.token)
    .eq("is_public", true)
    .single();

  const name = collection?.name ?? "맛집 컬렉션";
  const desc = collection?.description ?? "추천 가게 모음";
  const count = collection?.item_count ?? 0;

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
          background: "linear-gradient(135deg, #2E8B57 0%, #1F5F3D 100%)",
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
            컬렉션 · {count}곳
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2,
              textShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            📚 {name}
          </div>
          <div style={{ fontSize: 30, fontWeight: 500, opacity: 0.95, lineHeight: 1.4 }}>
            {desc.slice(0, 90)}
          </div>
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
          <span>친구가 직접 정리한 미식 큐레이션</span>
          <span style={{ fontWeight: 700 }}>eatlog.duckdns.org</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
