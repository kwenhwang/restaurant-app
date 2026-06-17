// Dynamic OG image for /r/[token] — shared individual restaurant.

import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "eatlog 가게 카드";

export default async function OGImage({ params }: { params: { token: string } }) {
  const admin = createAdminClient();
  const { data: restaurant } = await admin
    .from("restaurants")
    .select("name, category, rating, note")
    .eq("share_token", params.token)
    .single();

  const name = restaurant?.name ?? "맛집";
  const category = restaurant?.category ?? "맛집";
  const rating = restaurant?.rating;
  const note = restaurant?.note?.slice(0, 100) ?? "공유 받은 가게";

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
          background: "linear-gradient(135deg, #1F1B16 0%, #4A3528 100%)",
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
            #{category}
            {rating ? ` · ${"★".repeat(rating)}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2,
              textShadow: "0 4px 12px rgba(0,0,0,0.25)",
            }}
          >
            {name}
          </div>
          {note && (
            <div
              style={{
                fontSize: 28,
                fontWeight: 500,
                opacity: 0.94,
                lineHeight: 1.4,
                fontStyle: "italic",
              }}
            >
              " {note} "
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
          <span>친구가 추천하는 가게</span>
          <span style={{ fontWeight: 700 }}>eatlog.duckdns.org</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
