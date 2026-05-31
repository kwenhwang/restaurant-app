import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LargeTitle } from "@/components/ui/LargeTitle";
import EmptyState from "@/components/ui/EmptyState";
import Sym from "@/components/ui/Sym";

export const dynamic = "force-dynamic";

type Collection = {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  is_public: boolean;
  share_token: string | null;
  item_count: number;
  updated_at: string;
};

export default async function CollectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("collections")
    .select("id, name, description, cover_image, is_public, share_token, item_count, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  const collections = (data ?? []) as Collection[];

  return (
    <div className="pb-24">
      <LargeTitle
        eyebrow="컬렉션"
        title="내 리스트"
        meta={collections.length > 0 ? `${collections.length}개 컬렉션` : undefined}
        trailing={
          <Link
            href="/collections/new"
            className="h-10 px-4 rounded-full text-[13px] font-bold inline-flex items-center gap-1.5"
            style={{ background: "var(--accent)", color: "white" }}
          >
            <Sym name="plus" size={14} strokeWidth={2.4} />
            새 리스트
          </Link>
        }
      />

      {collections.length === 0 ? (
        <EmptyState
          emoji="📚"
          title="아직 컬렉션이 없어요"
          body={
            <>
              데이트 코스, 회식 자리, 친구 추천… <br />
              테마별로 맛집을 모아보세요.
            </>
          }
          cta="첫 컬렉션 만들기"
          ctaHref="/collections/new"
          ctaIcon="plus"
        />
      ) : (
        <div className="px-[18px] grid grid-cols-2 gap-3">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.id}`}
              className="block rounded-2xl overflow-hidden relative aspect-[3/4] transition-transform active:scale-[0.97]"
              style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
            >
              {c.cover_image ? (
                <img
                  src={c.cover_image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(160deg, var(--accent-soft) 0%, var(--accent-2-soft) 100%)",
                  }}
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)",
                }}
              />
              {c.is_public && (
                <span
                  className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.92)", color: "var(--text)" }}
                >
                  공개
                </span>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <div className="font-display text-[17px] font-extrabold leading-tight line-clamp-2">
                  {c.name}
                </div>
                <div className="text-[11px] mt-1 opacity-90 tabular-nums">
                  {c.item_count}곳
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
