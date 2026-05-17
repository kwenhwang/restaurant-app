import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { deleteImage } from "@/lib/storage";
import ImageUpload from "@/components/restaurants/ImageUpload";
import RestaurantActionsMenu from "@/components/restaurants/RestaurantActionsMenu";
import FavoriteButton from "@/components/restaurants/FavoriteButton";
import FindMenuButton from "@/components/restaurants/FindMenuButton";
import MenuPendingPoll from "@/components/restaurants/MenuPendingPoll";
import { categoryStyle } from "@/lib/category-icons";
import { ensureShareToken } from "./share-action";
import { applyCategory } from "./category-action";
import { appendNote } from "./note-action";
import { saveMenu } from "./menu-action";
import AddVisit from "@/components/visits/AddVisit";
import VisitList from "@/components/visits/VisitList";
import Sym from "@/components/ui/Sym";
import Stars from "@/components/ui/Stars";
import { SectionHeader, Group, ListRow } from "@/components/ui/Group";

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

  const { data: visits } = await supabase
    .from("visits")
    .select("*")
    .eq("restaurant_id", id)
    .order("visited_at", { ascending: false });

  async function deleteRestaurant() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Fetch image storage paths so we can clean up MinIO orphans
    const { data: imgs } = await supabase
      .from("restaurant_images")
      .select("storage_path")
      .eq("restaurant_id", id);

    // Verify ownership + delete row (cascade handles images, visits)
    const { error: delErr } = await supabase
      .from("restaurants")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (delErr) throw delErr;

    // Best-effort MinIO cleanup (failures shouldn't block)
    for (const i of imgs ?? []) {
      await deleteImage(i.storage_path).catch(() => {});
    }

    redirect("/");
  }

  const primary =
    restaurant.images?.find((i: { is_primary?: boolean }) => i.is_primary) ??
    restaurant.images?.[0];

  const visitCount = visits?.length ?? 0;
  const lastVisit = visits?.[0]?.visited_at;

  return (
    <article>
      {/* Hero */}
      <div className="relative">
        {primary ? (
          <div className="relative w-full h-[300px]">
            <Image
              src={imageUrl(primary.storage_path)}
              alt={restaurant.name}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              priority
              className="object-cover"
            />
          </div>
        ) : (() => {
          const s = categoryStyle(restaurant.category);
          return (
            <div
              className="w-full h-[300px] flex items-center justify-center text-[100px]"
              style={{ background: s.gradient }}
              aria-hidden="true"
            >
              <span style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.12))" }}>{s.emoji}</span>
            </div>
          );
        })()}

        {/* Glass nav overlay */}
        <div className="absolute top-12 left-4 right-4 flex justify-between">
          <GlassPill href="/">
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
            className="absolute right-4 bottom-4 px-2.5 py-1 rounded-full text-white text-[12px] font-semibold"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          >
            1 / {restaurant.images.length}
          </div>
        )}
      </div>

      {/* Header card overlapping hero */}
      <section
        className="relative px-5 pt-5 pb-2"
        style={{
          background: "var(--bg)",
          marginTop: -20,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1
              className="text-[28px] font-extrabold"
              style={{ letterSpacing: "-0.6px" }}
            >
              {restaurant.name}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              {restaurant.rating && (
                <>
                  <Stars value={restaurant.rating} size={14} />
                  <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                    {restaurant.rating}.0
                  </span>
                </>
              )}
              {restaurant.category && (
                <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                  · {restaurant.category}
                </span>
              )}
            </div>
          </div>
          <FavoriteButton
            restaurantId={id}
            initial={Boolean(restaurant.is_favorite)}
          />
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-4">
          {restaurant.lat && restaurant.lng && (
            <QuickAction
              icon="mappin.and.ellipse"
              label="길찾기"
              href={`https://map.kakao.com/link/to/${encodeURIComponent(restaurant.name)},${restaurant.lat},${restaurant.lng}`}
              external
            />
          )}
          <QuickAction icon="plus.circle.fill" label="방문 기록" href="#visits" />
          <QuickAction
            icon="square.and.pencil"
            label="수정"
            href={`/restaurants/${id}/edit`}
          />
        </div>
      </section>

      {/* Photos */}
      <section className="px-4">
        <SectionHeader>사진</SectionHeader>
        <div className="bg-white rounded-2xl p-2">
          <ImageUpload
            restaurantId={id}
            images={restaurant.images ?? []}
            currentCategory={restaurant.category ?? null}
            applyCategory={applyCategory}
            saveMenu={saveMenu}
          />
        </div>
      </section>

      {/* Menu */}
      <section className="px-4">
        <SectionHeader>메뉴</SectionHeader>
        {(!restaurant.menu || !restaurant.menu.items || restaurant.menu.items.length === 0) ? (
          (() => {
            // If restaurant was just created (<= 60s ago) menu is being auto-fetched
            // in the background — show a pending indicator + poller.
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
          <div className="bg-white rounded-2xl overflow-hidden">
            {restaurant.menu.summary && (
              <div
                className="px-4 py-3 text-[13px]"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--text)",
                }}
              >
                {restaurant.menu.summary}
              </div>
            )}
            <ul>
              {restaurant.menu.items.map(
                (item: { name: string; price: string | null }, i: number) => (
                  <li
                    key={i}
                    className="flex justify-between items-baseline gap-2 px-4 py-2.5"
                    style={{
                      borderTop: i > 0 ? "1px solid var(--separator)" : "none",
                    }}
                  >
                    <span className="text-[15px] truncate">{item.name}</span>
                    {item.price && (
                      <span
                        className="text-[14px] font-semibold shrink-0"
                        style={{ color: "var(--text-2)" }}
                      >
                        {item.price}
                      </span>
                    )}
                  </li>
                )
              )}
            </ul>
            {restaurant.menu.price_range && (
              <div
                className="px-4 py-2.5 text-[12px] font-mono"
                style={{
                  borderTop: "1px solid var(--separator)",
                  color: "var(--text-2)",
                }}
              >
                가격대: {restaurant.menu.price_range}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Info */}
      <section className="px-4">
        <SectionHeader>정보</SectionHeader>
        <Group>
          {restaurant.address && (
            <ListRow
              icon="mappin"
              label={restaurant.address}
              trailing={<Sym name="chevron.right" size={14} />}
            />
          )}
          {restaurant.category && (
            <ListRow icon="fork.knife" label={restaurant.category} />
          )}
          <ListRow
            icon="calendar"
            label={`${visitCount}회 방문`}
            detail={
              lastVisit
                ? `최근 ${new Date(lastVisit).getMonth() + 1}/${new Date(lastVisit).getDate()}`
                : undefined
            }
          />
        </Group>
      </section>

      {/* Memo */}
      {restaurant.note && (
        <section className="px-4">
          <SectionHeader>메모</SectionHeader>
          <div
            className="rounded-2xl p-4 text-[15px] leading-relaxed"
            style={{ background: "var(--surface)", letterSpacing: "-0.2px" }}
          >
            <div
              className="text-[28px] mb-2"
              style={{ color: "var(--accent)", lineHeight: 0.5 }}
            >
              “
            </div>
            {restaurant.note}
          </div>
        </section>
      )}

      {/* Visits */}
      <section id="visits" className="px-4" style={{ scrollMarginTop: 80 }}>
        <SectionHeader>방문 기록</SectionHeader>
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface)" }}
        >
          <AddVisit restaurantId={id} />
          <div className="mt-3">
            <VisitList visits={visits ?? []} />
          </div>
        </div>
      </section>
    </article>
  );
}

function GlassPill({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  const inner = (
    <div
      className="relative w-[38px] h-[38px] rounded-full overflow-hidden flex items-center justify-center glass"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.18)", color: "var(--text)" }}
    >
      {children}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function QuickAction({
  icon,
  label,
  href,
  external,
}: {
  icon: React.ComponentProps<typeof Sym>["name"];
  label: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <div
      className="flex-1 h-16 rounded-[14px] bg-white flex flex-col items-center justify-center gap-1"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <span style={{ color: "var(--accent)" }}>
        <Sym name={icon} size={20} />
      </span>
      <span className="text-[11px] font-semibold">{label}</span>
    </div>
  );

  if (!href) return inner;

  // External or in-page anchor → plain <a>; internal Next route → Link
  if (external || href.startsWith("#") || href.startsWith("http")) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="flex-1"
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className="flex-1">
      {inner}
    </Link>
  );
}
