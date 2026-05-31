// app/c/[token]/page.tsx — Public shared collection view.
// Accessible without auth. Uses the service-role admin client because RLS
// would let the same query through for is_public collections anyway —
// but the admin client avoids any auth-cookie noise on unauthenticated
// visits.

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { categoryStyle } from "@/lib/category-icons";
import Sym from "@/components/ui/Sym";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: c } = await admin
    .from("collections")
    .select("name, description, item_count")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();
  if (!c) return { title: "맛집 컬렉션" };
  return {
    title: `${c.name} — 맛집 컬렉션 ${c.item_count}곳`,
    description: c.description ?? `${c.item_count}곳의 맛집 큐레이션`,
    openGraph: {
      title: c.name,
      description: c.description ?? `${c.item_count}곳의 맛집 큐레이션`,
      type: "article",
    },
  };
}

export default async function PublicCollectionPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: collection } = await admin
    .from("collections")
    .select("id, name, description, cover_image, item_count, created_at")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!collection) notFound();

  const { data: items } = await admin
    .from("collection_items")
    .select(
      "restaurant_id, order_index, restaurants!inner(id, name, category, address, rating, restaurant_images(storage_path, is_primary))",
    )
    .eq("collection_id", collection.id)
    .order("order_index", { ascending: true });

  type Row = {
    restaurant_id: string;
    restaurants: {
      id: string;
      name: string;
      category: string | null;
      address: string | null;
      rating: number | null;
      restaurant_images: { storage_path: string; is_primary: boolean | null }[];
    };
  };
  const rows = (items ?? []) as unknown as Row[];

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg)" }}>
      {/* HERO */}
      <header className="relative w-full overflow-hidden" style={{ height: 280 }}>
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
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.65) 100%)" }}
        />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="text-[12px] font-bold opacity-90 uppercase tracking-wider">
            맛집 컬렉션 · {rows.length}곳
          </div>
          <h1 className="font-display text-[32px] font-black leading-tight mt-1">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-[14.5px] opacity-95 mt-2 leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>
      </header>

      <main className="px-[18px] mt-6 space-y-3">
        {rows.length === 0 ? (
          <p className="text-center py-12 text-[14px]" style={{ color: "var(--text-2)" }}>
            아직 맛집이 없는 컬렉션이에요.
          </p>
        ) : (
          rows.map((it, idx) => {
            const r = it.restaurants;
            const primary =
              r.restaurant_images?.find((i) => i.is_primary) ?? r.restaurant_images?.[0];
            const s = categoryStyle(r.category);
            return (
              <div
                key={r.id}
                className="rounded-2xl overflow-hidden flex gap-3 items-stretch"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
              >
                <div
                  className="relative shrink-0"
                  style={{ width: 96, height: 96 }}
                >
                  {primary ? (
                    <Image
                      src={`${IMAGE_BASE}/${primary.storage_path}`}
                      alt={r.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-[36px]"
                      style={{ background: s.gradient }}
                    >
                      {s.emoji}
                    </div>
                  )}
                  <span
                    className="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold tabular-nums text-white"
                    style={{ background: "rgba(0,0,0,0.65)" }}
                  >
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1 py-3 pr-3 min-w-0">
                  <div className="font-display text-[17px] font-extrabold truncate">{r.name}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--text-2)" }}>
                    {r.category ?? "기타"}
                    {r.rating != null && <> · ⭐ {r.rating}</>}
                  </div>
                  {r.address && (
                    <div className="text-[12px] mt-1 truncate" style={{ color: "var(--text-3)" }}>
                      {r.address}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* CTA */}
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
            나도 맛집<br />기록 시작하기
          </h2>
          <p className="text-[14px] mt-2 text-white/90 leading-relaxed">
            사진 한 장으로 시작하는 나만의 미식 일지
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
    </div>
  );
}
