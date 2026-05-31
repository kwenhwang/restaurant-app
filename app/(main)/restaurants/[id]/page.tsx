// app/(main)/restaurants/[id]/page.tsx — v3 (D1/D2)
// Data layer UNCHANGED from v2 (detail row, cached menu, visits, tags, ranking,
// category-scoped rank, deleteRestaurant server action). Re-skinned only:
//   · magazine-cover hero (~60vh) with serif name + score/rank overlay
//   · sticky header on scroll (RestaurantStickyHeader)
//   · editorial numbered section headers
//   · emphasized menu (price-range callout) + clearer info hierarchy
// Working sub-components (PlaceInfoGroup, TagList, RankPanel, AddVisit,
// VisitList, ImageUpload, FindMenuButton, RestaurantActionsMenu) are reused.

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { deleteImage } from "@/lib/storage";
import ImageUpload from "@/components/restaurants/ImageUpload";
import RestaurantActionsMenu from "@/components/restaurants/RestaurantActionsMenu";
import RestaurantStickyHeader from "@/components/restaurants/RestaurantStickyHeader";
import CategoryPlaceholder from "@/components/restaurants/CategoryPlaceholder";
import FavoriteButton from "@/components/restaurants/FavoriteButton";
import FindMenuButton from "@/components/restaurants/FindMenuButton";
import MenuPendingPoll from "@/components/restaurants/MenuPendingPoll";
import PlaceInfoGroup from "@/components/restaurants/PlaceInfoGroup";
import TagList from "@/components/restaurants/TagList";
import RankPanel from "@/components/restaurants/RankPanel";
import BlogReviewsSection from "@/components/restaurants/BlogReviewsSection";
import AddToCollectionButton from "@/components/collections/AddToCollectionButton";
import { categoryStyle } from "@/lib/category-icons";
import { tryCachedMenu } from "@/lib/menu-cache-lookup";
import { rankAll } from "@/lib/rankings";
import { ensureShareToken } from "./share-action";
import { applyCategory } from "./category-action";
import { saveMenu } from "./menu-action";
import AddVisit from "@/components/visits/AddVisit";
import VisitList from "@/components/visits/VisitList";
import Sym from "@/components/ui/Sym";
import Stars from "@/components/ui/Stars";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

function imageUrl(path: string) {
  return `${IMAGE_BASE}/${path}`;
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*, images:restaurant_images(*)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!restaurant) notFound();

  if (
    (!restaurant.menu ||
      !(restaurant.menu as { items?: unknown[] }).items?.length) &&
    restaurant.name
  ) {
    const cached = await tryCachedMenu({
      restaurantId: id,
      userId: user!.id,
      name: restaurant.name,
      lat: restaurant.lat,
      lng: restaurant.lng,
    });
    if (cached) restaurant.menu = cached;
  }

  const { data: visits } = await supabase
    .from("visits")
    .select("*")
    .eq("restaurant_id", id)
    .order("visited_at", { ascending: false });

  const { data: tagRows } = await supabase
    .from("restaurant_tags")
    .select("tag")
    .eq("restaurant_id", id);
  const tags = (tagRows ?? []).map((t) => t.tag);

  const { data: allR } = await supabase
    .from("restaurants")
    .select("id, rating, category, created_at")
    .eq("user_id", user!.id);

  const { data: allVisits } = await supabase
    .from("visits")
    .select("restaurant_id")
    .eq("user_id", user!.id);
  const visitMap = new Map<string, number>();
  for (const v of allVisits ?? []) {
    visitMap.set(v.restaurant_id, (visitMap.get(v.restaurant_id) ?? 0) + 1);
  }

  const rankInput = (allR ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    visit_count: visitMap.get(r.id) ?? 0,
    created_at: r.created_at,
  }));
  const rankMap = rankAll(rankInput);
  const totalRestaurants = rankInput.length;
  const rank = rankMap.get(id) ?? totalRestaurants;

  let categoryRank: number | undefined;
  let categoryTotal: number | undefined;
  if (restaurant.category) {
    const sameCat = rankInput.filter(
      (r) => allR?.find((x) => x.id === r.id)?.category === restaurant.category
    );
    categoryTotal = sameCat.length;
    const catRankMap = rankAll(sameCat);
    categoryRank = catRankMap.get(id);
  }

  async function deleteRestaurant() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: imgs } = await supabase
      .from("restaurant_images")
      .select("storage_path")
      .eq("restaurant_id", id);

    const { error: delErr } = await supabase
      .from("restaurants")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (delErr) throw delErr;

    for (const i of imgs ?? []) {
      await deleteImage(i.storage_path).catch(() => {});
    }
    redirect("/");
  }

  const primary =
    restaurant.images?.find((i: { is_primary?: boolean }) => i.is_primary) ??
    restaurant.images?.[0];

  const visitCount = visits?.length ?? 0;
  const s = categoryStyle(restaurant.category);
  const gold = rank <= 3;
  const pct =
    totalRestaurants <= 1 ? 100 : Math.round(((totalRestaurants - rank) / (totalRestaurants - 1)) * 100);

  return (
    <article className="animate-fade-up">
      <RestaurantStickyHeader name={restaurant.name} />

      {/* HERO — magazine cover ~60vh */}
      <div className="relative" style={{ height: "58vh", minHeight: 360, maxHeight: 560 }}>
        {primary ? (
          <Image
            src={imageUrl(primary.storage_path)}
            alt={restaurant.name}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            priority
            className="object-cover"
          />
        ) : (
          <CategoryPlaceholder category={restaurant.category} size="hero" />
        )}

        {/* scrim */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg,rgba(0,0,0,0.3) 0%,rgba(0,0,0,0) 28%,rgba(0,0,0,0) 46%,rgba(20,14,8,0.82) 100%)" }}
        />

        {/* top controls */}
        <div className="absolute top-12 left-4 right-4 flex justify-between">
          <GlassPill href="/" label="홈으로 돌아가기">
            <Sym name="chevron.left" size={18} />
          </GlassPill>
          <RestaurantActionsMenu
            restaurantId={id}
            restaurantName={restaurant.name}
            deleteAction={deleteRestaurant}
            ensureShareToken={ensureShareToken}
          />
        </div>

        {restaurant.images && restaurant.images.length > 1 && (
          <div
            className="absolute right-4 top-[68px] px-2.5 py-1 rounded-full text-white text-[12px] font-bold tabular-nums"
            style={{ background: "rgba(20,16,12,0.5)", backdropFilter: "blur(8px)" }}
          >
            1 / {restaurant.images.length}
          </div>
        )}

        {/* cover text */}
        <div className="absolute left-[18px] right-[18px] bottom-7 text-white">
          {totalRestaurants >= 2 && rank <= 10 && (
            <div className="mb-3">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-extrabold tabular-nums"
                style={{ background: gold ? "rgba(182,137,47,0.92)" : "rgba(242,98,46,0.92)", color: "#fff", backdropFilter: "blur(4px)" }}
              >
                <Sym name="star.fill" size={12} />
                내 맛집 중 {rank}위 · 상위 {pct}%
              </span>
            </div>
          )}
          <span
            className="inline-block px-2.5 py-1 rounded-full text-[12.5px] font-bold mb-2"
            style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(6px)" }}
          >
            {s.emoji} {restaurant.category}
          </span>
          <h1
            className="font-display text-[40px] font-black leading-[1.0]"
            style={{ letterSpacing: "-1px", textShadow: "0 2px 18px rgba(0,0,0,0.45)" }}
          >
            {restaurant.name}
          </h1>
          <div className="flex items-center gap-2.5 mt-3">
            {restaurant.rating && (
              <>
                <Stars value={restaurant.rating} size={16} />
                <span className="font-extrabold text-[15px] tabular-nums">{restaurant.rating}.0</span>
              </>
            )}
            {visitCount > 0 && (
              <span className="text-[13.5px] tabular-nums" style={{ color: "rgba(255,255,255,0.85)" }}>
                · {visitCount}회 방문
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT SHEET */}
      <div
        className="relative"
        style={{ marginTop: -22, borderTopLeftRadius: 26, borderTopRightRadius: 26, background: "var(--bg)", paddingTop: 18 }}
      >
        {/* favorite + tags */}
        <div className="px-[18px] flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-1.5 pl-3.5 pr-1.5 py-1.5 rounded-full"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
          >
            <span className="text-[13px] font-bold" style={{ color: "var(--text-2)" }}>즐겨찾기</span>
            <FavoriteButton restaurantId={id} initial={Boolean(restaurant.is_favorite)} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <TagList restaurantId={id} initial={tags} />
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-[18px] pt-4 flex gap-2.5">
          {restaurant.lat && restaurant.lng && (
            <QuickAction
              icon="location.fill"
              label="길찾기"
              tone="var(--accent-2)"
              href={`https://map.kakao.com/link/to/${encodeURIComponent(restaurant.name)},${restaurant.lat},${restaurant.lng}`}
              external
            />
          )}
          <QuickAction icon="plus.circle.fill" label="방문 기록" tone="var(--accent)" href="#visits" />
          <AddToCollectionButton restaurantId={id} />
          <QuickAction icon="square.and.pencil" label="수정" tone="var(--text)" href={`/restaurants/${id}/edit`} />
        </div>

        {/* MENU — emphasized */}
        <Sec index={1} title="메뉴" sub={restaurant.menu?.summary ?? undefined}>
          {(!restaurant.menu || !restaurant.menu.items || restaurant.menu.items.length === 0) ? (
            (() => {
              const justCreated =
                restaurant.created_at &&
                Date.now() - new Date(restaurant.created_at).getTime() < 60_000;
              return justCreated ? (
                <>
                  <MenuPendingPoll restaurantId={id} />
                  <div className="mt-2">
                    <FindMenuButton restaurantId={id} saveMenu={saveMenu} />
                  </div>
                </>
              ) : (
                <FindMenuButton restaurantId={id} saveMenu={saveMenu} />
              );
            })()
          ) : (
            <div className="overflow-hidden" style={{ borderRadius: 20, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
              {restaurant.menu.price_range && (
                <div
                  className="px-[18px] py-4 flex items-center justify-between"
                  style={{ background: "linear-gradient(120deg, var(--accent-soft), color-mix(in srgb, var(--accent-2-soft) 60%, transparent))" }}
                >
                  <span className="text-[13px] font-bold" style={{ color: "var(--text-2)" }}>가격대</span>
                  <span className="font-display text-[22px] font-black tabular-nums" style={{ color: "var(--accent-press)" }}>
                    {restaurant.menu.price_range}
                  </span>
                </div>
              )}
              <ul>
                {restaurant.menu.items.map(
                  (item: { name: string; price: string | null }, i: number) => (
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
                  )
                )}
              </ul>
            </div>
          )}
        </Sec>

        {/* BLOG REVIEWS — AI-summarized */}
        <Sec index={2} title="블로그 후기" sub="여러 후기를 AI가 요약했어요">
          <BlogReviewsSection
            restaurantId={id}
            initial={restaurant.reviews ?? null}
          />
        </Sec>

        {/* PHOTOS */}
        <Sec index={3} title="사진">
          <div className="p-2" style={{ borderRadius: 20, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
            <ImageUpload
              restaurantId={id}
              images={restaurant.images ?? []}
              currentCategory={restaurant.category ?? null}
              applyCategory={applyCategory}
              saveMenu={saveMenu}
            />
          </div>
        </Sec>

        {/* PLACE INFO */}
        {(restaurant.address || restaurant.phone || restaurant.business_hours || restaurant.place_url) && (
          <Sec index={4} title="가게 정보">
            <PlaceInfoGroup
              address={restaurant.address ?? null}
              phone={restaurant.phone ?? null}
              hours={restaurant.business_hours ?? null}
              placeUrl={restaurant.place_url ?? null}
              syncedAt={restaurant.place_synced_at ?? null}
            />
          </Sec>
        )}

        {/* RANK PANEL */}
        {totalRestaurants >= 2 && (
          <Sec index={5} title="내 평가 위치">
            <RankPanel
              rank={rank}
              total={totalRestaurants}
              categoryRank={categoryRank}
              categoryTotal={categoryTotal}
              category={restaurant.category}
            />
          </Sec>
        )}

        {/* MEMO */}
        {restaurant.note && (
          <Sec index={6} title="메모">
            <div
              className="p-5"
              style={{ borderRadius: 20, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
            >
              <div className="font-display text-[46px]" style={{ color: "var(--accent)", lineHeight: 0.3, height: 22 }}>“</div>
              <p className="font-display text-[17px] font-medium leading-[1.7]">{restaurant.note}</p>
            </div>
          </Sec>
        )}

        {/* VISITS */}
        <section id="visits" className="px-[18px] pt-7" style={{ scrollMarginTop: 80 }}>
          <SecHeader index={6} title="방문 기록" sub={visitCount > 0 ? `${visitCount}번 다녀왔어요` : undefined} />
          <div className="p-4" style={{ borderRadius: 20, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
            <AddVisit restaurantId={id} />
            <div className="mt-3">
              <VisitList visits={visits ?? []} />
            </div>
          </div>
        </section>

        <div style={{ height: 24 }} />
      </div>
    </article>
  );
}

/* ── editorial section header + wrapper ─────────────────────────── */
function SecHeader({ index, title, sub }: { index: number; title: string; sub?: string }) {
  return (
    <div className="flex items-end gap-2.5 mb-3 px-0.5">
      <span className="font-display font-black tabular-nums leading-none" style={{ fontSize: 16, color: "var(--text-3)" }}>
        {String(index).padStart(2, "0")}
      </span>
      <h2 className="font-display text-[20px] font-extrabold">{title}</h2>
      {sub && (
        <span className="text-[12.5px] ml-auto text-right leading-snug" style={{ color: "var(--text-2)", maxWidth: "55%" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function Sec({ index, title, sub, children }: { index: number; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="px-[18px] pt-7">
      <SecHeader index={index} title={title} sub={sub} />
      {children}
    </section>
  );
}

function GlassPill({ href, label, children }: { href?: string; label?: string; children: ReactNode }) {
  const inner = (
    <div
      className="on-photo relative w-[38px] h-[38px] rounded-full overflow-hidden flex items-center justify-center"
      style={{ background: "rgba(20,16,12,0.34)", backdropFilter: "blur(10px)", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}
    >
      {children}
    </div>
  );
  return href ? (
    <Link href={href} aria-label={label}>
      {inner}
    </Link>
  ) : (
    inner
  );
}

function QuickAction({
  icon,
  label,
  tone,
  href,
  external,
}: {
  icon: React.ComponentProps<typeof Sym>["name"];
  label: string;
  tone: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-1.5"
      style={{ height: 66, borderRadius: 16, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
    >
      <span style={{ color: tone }} aria-hidden="true">
        <Sym name={icon} size={21} />
      </span>
      <span className="text-[11.5px] font-bold">{label}</span>
    </div>
  );
  if (!href) return inner;
  if (external || href.startsWith("#") || href.startsWith("http")) {
    return (
      <a
        href={href}
        aria-label={label}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="flex-1"
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} aria-label={label} className="flex-1">
      {inner}
    </Link>
  );
}
