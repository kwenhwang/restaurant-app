// app/r/[token]/page.tsx — v3 (F3)
// Data layer UNCHANGED (admin client, share_token query, generateMetadata).
// Re-skinned for external sharing: magazine-cover hero, emphasized menu/price,
// strong "나도 시작하기" CTA. When a friend opens the link it should feel like
// a recommendation, not a bare info page.

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import Sym from "@/components/ui/Sym";
import CategoryPlaceholder from "@/components/restaurants/CategoryPlaceholder";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const sb = createAdminClient();
  const { data: r } = await sb
    .from("restaurants")
    .select("name, note")
    .eq("share_token", token)
    .single();
  return {
    title: r ? `${r.name} | 맛집 기록장` : "맛집",
    description: r?.note ?? "맛집 기록장에서 공유된 맛집",
  };
}

export default async function SharedRestaurantPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const sb = createAdminClient();

  const { data: restaurant } = await sb
    .from("restaurants")
    .select(
      "id, user_id, name, address, lat, lng, category, note, menu, images:restaurant_images(id, storage_path, is_primary, blur_data_url)"
    )
    .eq("share_token", token)
    .single();

  if (!restaurant) notFound();

  // Owner의 tier (대결 평가 결과) 조회 — 공개 페이지에서도 표시
  const { data: score } = await sb
    .from("restaurant_scores")
    .select("tier")
    .eq("restaurant_id", restaurant.id)
    .eq("user_id", restaurant.user_id)
    .maybeSingle();
  const ownerTier = (score?.tier ?? null) as 0 | 1 | 2 | null;

  const primary =
    restaurant.images?.find((i: { is_primary?: boolean }) => i.is_primary) ??
    restaurant.images?.[0];
  const menu = restaurant.menu as
    | { items?: { name: string; price: string | null }[]; price_range?: string | null }
    | null;

  return (
    <article className="min-h-screen animate-fade-up" style={{ background: "var(--bg)" }}>
      {/* HERO */}
      <div className="relative" style={{ height: 360 }}>
        {primary ? (
          <Image
            src={`${IMAGE_BASE}/${primary.storage_path}`}
            alt={restaurant.name}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            priority
            className="object-cover"
            {...(primary.blur_data_url
              ? { placeholder: "blur" as const, blurDataURL: primary.blur_data_url }
              : {})}
          />
        ) : (
          <CategoryPlaceholder category={restaurant.category} size="hero" />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(0,0,0,0.3) 0%,rgba(0,0,0,0) 30%,rgba(20,14,8,0.8) 100%)" }} />

        <div
          className="absolute top-[18px] left-[18px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[12.5px] font-bold"
          style={{ background: "rgba(20,16,12,0.42)", backdropFilter: "blur(8px)" }}
        >
          <Sym name="fork.knife" size={14} /> 맛집 기록장
        </div>

        <div className="absolute left-[18px] right-[18px] bottom-[22px] text-white">
          <div className="text-[13px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.85)" }}>
            친구가 추천하는 맛집
          </div>
          <h1 className="font-display text-[36px] font-black" style={{ letterSpacing: "-0.8px", textShadow: "0 2px 16px rgba(0,0,0,0.45)" }}>
            {restaurant.name}
          </h1>
          <div className="flex items-center gap-2.5 mt-2.5">
            {ownerTier != null && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12.5px] font-extrabold"
                style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(6px)" }}
              >
                {ownerTier === 0 ? "😍 좋아함" : ownerTier === 1 ? "🙂 괜찮음" : "😐 별로"}
              </span>
            )}
            {restaurant.category && (
              <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold" style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(6px)" }}>
                {restaurant.category}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-[18px] pt-5 pb-2">
        {/* Memo */}
        {restaurant.note && (
          <div className="p-4" style={{ borderRadius: 18, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
            <div className="font-display text-[38px]" style={{ color: "var(--accent)", lineHeight: 0.3, height: 18 }}>“</div>
            <p className="font-display text-[16px] font-medium leading-[1.65]">{restaurant.note}</p>
          </div>
        )}

        {/* Menu / price */}
        {menu?.items && menu.items.length > 0 && (
          <div className="mt-4 overflow-hidden" style={{ borderRadius: 18, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
            <div
              className="px-[18px] py-3.5 flex items-center justify-between"
              style={{ background: "linear-gradient(120deg, var(--accent-soft), color-mix(in srgb, var(--accent-2-soft) 55%, transparent))" }}
            >
              <span className="text-[13px] font-bold" style={{ color: "var(--text-2)" }}>대표 메뉴 · 가격대</span>
              {menu.price_range && (
                <span className="font-display text-[18px] font-black tabular-nums" style={{ color: "var(--accent-press)" }}>{menu.price_range}</span>
              )}
            </div>
            {menu.items.slice(0, 4).map((it, i) => (
              <div key={i} className="flex justify-between px-[18px] py-3" style={{ borderTop: "0.5px solid var(--separator)" }}>
                <span className="text-[14.5px] font-semibold">{it.name}</span>
                {it.price && <span className="text-[14px] font-extrabold tabular-nums">{it.price}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Address */}
        {restaurant.address && (
          <div className="mt-4 flex items-center gap-3 p-3.5" style={{ borderRadius: 18, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
            <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "var(--accent-2-soft)", color: "var(--accent-2)" }}>
              <Sym name="mappin.and.ellipse" size={18} />
            </div>
            <div className="flex-1 text-[14px]">{restaurant.address}</div>
            {restaurant.lat && restaurant.lng && (
              <a
                href={`https://map.kakao.com/link/to/${encodeURIComponent(restaurant.name)},${restaurant.lat},${restaurant.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="길찾기"
                style={{ color: "var(--text-3)" }}
              >
                <Sym name="arrow.up.right" size={16} />
              </a>
            )}
          </div>
        )}

        {/* Extra photos */}
        {restaurant.images && restaurant.images.length > 1 && (
          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {restaurant.images.slice(1, 7).map((img: { id: string; storage_path: string; blur_data_url?: string | null }) => (
              <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden" style={{ background: "var(--bg-2)" }}>
                <Image
                  src={`${IMAGE_BASE}/${img.storage_path}`}
                  alt=""
                  fill
                  sizes="(max-width:768px) 33vw, 200px"
                  className="object-cover"
                  {...(img.blur_data_url
                    ? { placeholder: "blur" as const, blurDataURL: img.blur_data_url }
                    : {})}
                />
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link
          href="/signup"
          className="mt-6 h-[54px] rounded-2xl flex items-center justify-center gap-2 text-white text-[16px] font-extrabold transition-transform active:scale-[0.98]"
          style={{ background: "var(--accent)", boxShadow: "0 10px 24px color-mix(in srgb, var(--accent) 36%, transparent)" }}
        >
          나도 맛집 기록 시작하기
          <Sym name="arrow.up.right" size={18} />
        </Link>
        <p className="text-center text-[12.5px] mt-3 pb-8" style={{ color: "var(--text-3)" }}>
          사진 한 장이면 30초 만에 시작돼요
        </p>
      </div>
    </article>
  );
}
