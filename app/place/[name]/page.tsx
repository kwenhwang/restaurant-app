// app/place/[name]/page.tsx
//
// Public, unauthenticated landing page for restaurants. Pulls cached menu
// (place_menus) and blog-review summary (place_reviews) — both keyed by
// normalized name + lat/lng bucket. Serves as a Naver/Google SEO front door:
// people searching "굴다리식당" find this page, see the menu + review
// summary, and the CTA invites them to sign up.
//
// URL conventions:
//   /place/굴다리식당          — name only (falls back to row with no coords)
//   /place/굴다리식당?at=36.49,127.26
//                                 — disambiguate via lat,lng bucket

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeName, bucketCoord } from "@/lib/place-cache";
import { categoryStyle } from "@/lib/category-icons";
import Sym from "@/components/ui/Sym";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

interface Props {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ at?: string }>;
}

interface Menu {
  summary?: string;
  items?: { name: string; price: string | null }[];
  price_range?: string | null;
  source_hint?: string;
}

interface Reviews {
  found: boolean;
  summary?: string;
  pros?: string[];
  cons?: string[];
  highlights?: string[];
  source_hint?: string;
  sources?: { url: string; title?: string }[];
}

function parseAt(at: string | undefined) {
  if (!at) return { lat: null as number | null, lng: null as number | null };
  const [latRaw, lngRaw] = at.split(",");
  const lat = parseFloat(latRaw);
  const lng = parseFloat(lngRaw);
  if (!isFinite(lat) || !isFinite(lng)) return { lat: null, lng: null };
  return { lat, lng };
}

async function findPlace(name: string, at: string | undefined) {
  const admin = createAdminClient();
  const { lat, lng } = parseAt(at);
  const { latBucket, lngBucket } = bucketCoord(lat, lng);
  const nameKey = normalizeName(decodeURIComponent(name));

  // Try menu first (more rows in cache than reviews)
  let menuQ = admin
    .from("place_menus")
    .select("display_name, menu, lat_bucket, lng_bucket, last_fetched_at")
    .eq("name_normalized", nameKey)
    .eq("fetch_status", "ok");
  if (latBucket !== null) {
    menuQ = menuQ.eq("lat_bucket", latBucket).eq("lng_bucket", lngBucket);
  }
  const { data: menuRows } = await menuQ;

  let chosen: {
    display_name: string;
    menu: Menu | null;
    lat: number | null;
    lng: number | null;
  } | null = null;

  if (menuRows && menuRows.length > 0) {
    const r = menuRows[0];
    chosen = {
      display_name: r.display_name,
      menu: (r.menu as Menu) ?? null,
      lat: r.lat_bucket as number | null,
      lng: r.lng_bucket as number | null,
    };
  }

  // Reviews — look up with matching coords
  let revQ = admin
    .from("place_reviews")
    .select("display_name, reviews, lat_bucket, lng_bucket")
    .eq("name_normalized", nameKey)
    .eq("fetch_status", "ok");
  if (chosen?.lat != null) {
    revQ = revQ.eq("lat_bucket", chosen.lat).eq("lng_bucket", chosen.lng);
  } else if (latBucket !== null) {
    revQ = revQ.eq("lat_bucket", latBucket).eq("lng_bucket", lngBucket);
  }
  const { data: revRows } = await revQ;
  const reviews: Reviews | null = revRows?.[0]?.reviews as Reviews | null;
  if (!chosen && revRows && revRows.length > 0) {
    chosen = {
      display_name: revRows[0].display_name,
      menu: null,
      lat: revRows[0].lat_bucket as number | null,
      lng: revRows[0].lng_bucket as number | null,
    };
  }

  if (!chosen) return null;

  return { ...chosen, reviews };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { name } = await params;
  const { at } = await searchParams;
  const place = await findPlace(name, at);
  if (!place) return { title: "맛집 - eatlog" };

  const desc =
    place.reviews?.summary ??
    place.menu?.summary ??
    `${place.display_name} 메뉴 · 블로그 후기 한눈에 정리`;

  return {
    title: `${place.display_name} - 메뉴와 후기 | eatlog`,
    description: desc.slice(0, 160),
    openGraph: {
      title: place.display_name,
      description: desc,
      type: "article",
      siteName: "eatlog",
    },
    alternates: {
      canonical:
        place.lat != null && place.lng != null
          ? `/place/${encodeURIComponent(place.display_name)}?at=${place.lat},${place.lng}`
          : `/place/${encodeURIComponent(place.display_name)}`,
    },
  };
}

export default async function PlacePage({ params, searchParams }: Props) {
  const { name } = await params;
  const { at } = await searchParams;
  const place = await findPlace(name, at);
  if (!place) notFound();

  const { display_name, menu, reviews } = place;
  const s = categoryStyle(null); // category isn't in the cache; use default
  const heroDesc =
    reviews?.summary ?? menu?.summary ?? "AI가 정리한 메뉴와 블로그 후기";

  // JSON-LD for Restaurant
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: display_name,
    description: heroDesc,
    ...(place.lat != null && place.lng != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: place.lat,
            longitude: place.lng,
          },
        }
      : {}),
    ...(menu?.price_range ? { priceRange: menu.price_range } : {}),
    ...(menu?.items && menu.items.length > 0
      ? {
          hasMenu: {
            "@type": "Menu",
            hasMenuSection: {
              "@type": "MenuSection",
              hasMenuItem: menu.items.slice(0, 20).map((it) => ({
                "@type": "MenuItem",
                name: it.name,
                ...(it.price ? { offers: { "@type": "Offer", price: it.price } } : {}),
              })),
            },
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg)" }}>
      {/* JSON-LD for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO — sets visual tone and SEO H1 */}
      <header
        className="relative w-full overflow-hidden"
        style={{ height: 280, background: s.gradient }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.55) 100%)" }}
        />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="text-[12px] font-bold uppercase tracking-wider opacity-90">eatlog</div>
          <h1 className="font-display text-[32px] font-black leading-tight mt-1">
            {display_name}
          </h1>
          <p className="text-[14.5px] opacity-95 mt-2 leading-relaxed line-clamp-3">
            {heroDesc}
          </p>
        </div>
      </header>

      {/* Reviews summary */}
      {reviews?.found && (
        <section className="px-[18px] mt-5">
          <h2 className="font-display text-[19px] font-extrabold mb-2">블로그 후기 요약</h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
          >
            {reviews.summary && (
              <div
                className="px-4 py-3 text-[14px] font-semibold"
                style={{ background: "var(--accent-soft)", color: "var(--text)" }}
              >
                {reviews.summary}
              </div>
            )}
            <div className="p-4 space-y-3">
              {reviews.pros && reviews.pros.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-2)" }}>
                    👍 좋은 점
                  </div>
                  <ul className="space-y-1">
                    {reviews.pros.map((p, i) => (
                      <li key={i} className="text-[14px] flex gap-2">
                        <span style={{ color: "var(--accent)" }}>·</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reviews.cons && reviews.cons.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-2)" }}>
                    ⚠️ 알아두면 좋은 점
                  </div>
                  <ul className="space-y-1">
                    {reviews.cons.map((c, i) => (
                      <li key={i} className="text-[14px] flex gap-2" style={{ color: "var(--text-2)" }}>
                        <span>·</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reviews.highlights && reviews.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {reviews.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="text-[12px] px-2 py-1 rounded-full"
                      style={{ background: "var(--bg)", color: "var(--text)" }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Menu */}
      {menu?.items && menu.items.length > 0 && (
        <section className="px-[18px] mt-7">
          <h2 className="font-display text-[19px] font-extrabold mb-2">메뉴</h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
          >
            {menu.price_range && (
              <div
                className="px-[18px] py-4 flex items-center justify-between"
                style={{ background: "linear-gradient(120deg, var(--accent-soft), color-mix(in srgb, var(--accent-2-soft) 60%, transparent))" }}
              >
                <span className="text-[13px] font-bold" style={{ color: "var(--text-2)" }}>가격대</span>
                <span className="font-display text-[22px] font-black tabular-nums" style={{ color: "var(--accent-press)" }}>
                  {menu.price_range}
                </span>
              </div>
            )}
            <ul>
              {menu.items.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between items-baseline gap-3 px-[18px] py-3.5"
                  style={{ borderTop: i > 0 ? "0.5px solid var(--separator)" : "none" }}
                >
                  <span className="text-[15.5px] font-semibold truncate">{item.name}</span>
                  {item.price && (
                    <span className="text-[15px] font-extrabold shrink-0 tabular-nums">{item.price}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {menu.source_hint && (
            <p className="text-[11px] mt-2 px-1" style={{ color: "var(--text-3)" }}>
              출처: {menu.source_hint}
            </p>
          )}
        </section>
      )}

      {/* CTA — sign up funnel */}
      <section className="mt-10 px-[18px]">
        <div
          className="rounded-3xl p-6 text-center"
          style={{
            background: "linear-gradient(160deg, var(--accent) 0%, var(--accent-press) 100%)",
            boxShadow: "0 18px 40px color-mix(in srgb, var(--accent) 32%, transparent)",
          }}
        >
          <div className="text-[13px] font-bold uppercase tracking-wider text-white/85">eatlog</div>
          <h2 className="font-display text-[24px] font-black text-white mt-1 leading-tight">
            나만의 미식 일지<br />지금 시작하기
          </h2>
          <p className="text-[14px] mt-2 text-white/90 leading-relaxed">
            사진 한 장으로 등록 · AI 메뉴 추출 · 블로그 후기 자동 요약
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex items-center gap-2 h-12 px-6 rounded-full text-[15px] font-extrabold"
            style={{ background: "white", color: "var(--accent-press)" }}
          >
            <Sym name="sparkles" size={16} /> 시작하기
          </Link>
        </div>
      </section>

      <footer className="mt-12 text-center text-[11px]" style={{ color: "var(--text-3)" }}>
        <Link href="/" className="underline">eatlog 홈</Link>
        <span> · </span>
        <Link href="/legal/terms" className="underline">이용약관</Link>
        <span> · </span>
        <Link href="/legal/privacy" className="underline">개인정보처리방침</Link>
      </footer>
    </div>
  );
}
