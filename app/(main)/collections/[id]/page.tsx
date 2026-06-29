import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RestaurantCard from "@/components/restaurants/RestaurantCard";
import CollectionShareBar from "@/components/collections/CollectionShareBar";
import CollectionItemActions from "@/components/collections/CollectionItemActions";
import Sym from "@/components/ui/Sym";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!collection) notFound();

  const { data: items } = await supabase
    .from("collection_items")
    .select(
      "restaurant_id, order_index, created_at, restaurants!inner(id, name, category, address, is_favorite, restaurant_images(id, storage_path, is_primary))",
    )
    .eq("collection_id", id)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  type Item = {
    restaurant_id: string;
    restaurants: {
      id: string;
      name: string;
      category?: string | null;
      address?: string | null;
      is_favorite?: boolean | null;
      restaurant_images?: { id: string; storage_path: string; is_primary: boolean | null }[];
    };
  };
  const rows = (items ?? []) as unknown as Item[];

  // tier lookup (대결 평가 결과) — 컬렉션 내 가게들 한 번에
  const restaurantIds = rows.map((r) => r.restaurant_id);
  const { data: scoreRows } = restaurantIds.length
    ? await supabase
        .from("restaurant_scores")
        .select("restaurant_id, tier")
        .eq("user_id", user.id)
        .in("restaurant_id", restaurantIds)
    : { data: [] };
  const tierByRid = new Map<string, 0 | 1 | 2>();
  for (const s of scoreRows ?? []) {
    if (s.tier != null) tierByRid.set(s.restaurant_id, s.tier as 0 | 1 | 2);
  }

  return (
    <div className="pb-24">
      {/* Hero */}
      <header
        className="relative w-full overflow-hidden"
        style={{ height: 220 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: collection.cover_image
              ? undefined
              : "linear-gradient(160deg, var(--accent-soft) 0%, var(--accent-2-soft) 100%)",
          }}
        />
        {collection.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={collection.cover_image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.55) 100%)" }}
        />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="text-[12px] font-bold opacity-90">
            {collection.is_public ? "공개 컬렉션" : "비공개"} · {rows.length}곳
          </div>
          <h1 className="font-display text-[28px] font-black leading-tight mt-1">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-[14px] opacity-95 mt-1 line-clamp-2">{collection.description}</p>
          )}
        </div>
        <Link
          href="/collections"
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center text-white"
          style={{ background: "rgba(0,0,0,0.32)", backdropFilter: "blur(8px)" }}
          aria-label="뒤로"
        >
          <Sym name="chevron.left" size={18} strokeWidth={2.4} />
        </Link>
        <Link
          href={`/collections/${id}/edit`}
          className="absolute top-4 right-4 h-9 px-3 rounded-full inline-flex items-center gap-1 text-[12px] font-bold text-white"
          style={{ background: "rgba(0,0,0,0.32)", backdropFilter: "blur(8px)" }}
        >
          <Sym name="square.and.pencil" size={14} strokeWidth={2.2} />
          편집
        </Link>
      </header>

      {/* Share / utilities */}
      {collection.is_public && collection.share_token && (
        <div className="px-[18px] mt-4">
          <CollectionShareBar token={collection.share_token} />
        </div>
      )}

      {/* Items */}
      <div className="px-[18px] mt-5">
        {rows.length === 0 ? (
          <div
            className="p-6 rounded-2xl text-center"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
          >
            <p className="text-[14px]" style={{ color: "var(--text-2)" }}>
              아직 맛집이 없어요.
            </p>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-3)" }}>
              맛집 상세 페이지에서 “컬렉션에 담기”로 추가할 수 있어요.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex h-10 px-4 rounded-full text-[13px] font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              맛집 둘러보기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((it) => (
              <div key={it.restaurant_id} className="relative">
                <RestaurantCard
                  restaurant={{
                    id: it.restaurants.id,
                    name: it.restaurants.name,
                    category: it.restaurants.category ?? null,
                    address: it.restaurants.address ?? null,
                    is_favorite: it.restaurants.is_favorite ?? false,
                    tier: tierByRid.get(it.restaurant_id) ?? null,
                    images: (it.restaurants.restaurant_images ?? []).map((im) => ({
                      id: im.id,
                      storage_path: im.storage_path,
                      is_primary: im.is_primary ?? false,
                    })),
                  }}
                />
                <CollectionItemActions
                  collectionId={id}
                  restaurantId={it.restaurant_id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
