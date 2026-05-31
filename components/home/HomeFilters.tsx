// components/home/HomeFilters.tsx — v3
// Keeps all v2 filter logic (search · category · mood tag · favorites · sort).
// New: editorial section rails (HomeSections) above the feed when no filter is
// active, and the photo-forward RestaurantCard list (A1/A3).

"use client";

import { useMemo, useState } from "react";
import RestaurantCard from "@/components/restaurants/RestaurantCard";
import HomeSections from "@/components/home/HomeSections";
import Sym from "@/components/ui/Sym";

interface Image {
  id: string;
  storage_path: string;
  is_primary?: boolean;
}

export interface RestaurantItem {
  id: string;
  name: string;
  address?: string | null;
  category?: string | null;
  rating?: number | null;
  is_favorite?: boolean;
  created_at?: string;
  images?: Image[];
  visit_count?: number;
  last_visit?: string | null;
  tags?: string[];
  rank?: number;
}

interface Props {
  restaurants: RestaurantItem[];
  categories: string[];
  popularTags?: string[];
}

type Sort = "recent" | "rating" | "name" | "rank" | "visits";

const SORT_LABEL: Record<Sort, string> = {
  rank: "순위",
  recent: "최신순",
  rating: "평점순",
  visits: "방문순",
  name: "이름순",
};

export default function HomeFilters({ restaurants, categories, popularTags = [] }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("전체");
  const [tag, setTag] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("rank");
  const [sortOpen, setSortOpen] = useState(false);

  const isFiltering =
    favoritesOnly || category !== "전체" || !!tag || query.trim().length > 0;

  const filtered = useMemo(() => {
    let list = restaurants;
    if (favoritesOnly) list = list.filter((r) => r.is_favorite);
    if (category !== "전체") list = list.filter((r) => r.category === category);
    if (tag) list = list.filter((r) => r.tags?.includes(tag));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.address ?? "").toLowerCase().includes(q) ||
          (r.category ?? "").toLowerCase().includes(q) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    else if (sort === "rating") sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sort === "visits") sorted.sort((a, b) => (b.visit_count ?? 0) - (a.visit_count ?? 0));
    else if (sort === "rank") sorted.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    else sorted.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return sorted;
  }, [restaurants, query, category, tag, favoritesOnly, sort]);

  const recent = useMemo(
    () => [...restaurants].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
    [restaurants]
  );

  const favCount = restaurants.filter((r) => r.is_favorite).length;

  return (
    <>
      {/* Search */}
      <div className="px-[18px] pb-2.5">
        <div
          className="h-[42px] rounded-[13px] flex items-center gap-2 px-3"
          style={{ background: "color-mix(in srgb, var(--text) 7%, transparent)" }}
        >
          <span style={{ color: "var(--text-2)" }}>
            <Sym name="magnifyingglass" size={17} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="가게 이름, 주소, 분위기 태그"
            className="flex-1 bg-transparent outline-none text-[15px]"
            style={{ color: "var(--text)" }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="지우기"
              className="w-5 h-5 rounded-full flex items-center justify-center text-[12px]"
              style={{ background: "rgba(118,118,128,0.4)", color: "white" }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Category chips + sort */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-[18px] pb-2 items-center">
        {favCount > 0 && (
          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            className="shrink-0 px-3 py-2 rounded-full text-[14px] font-bold flex items-center gap-1 transition-colors"
            style={
              favoritesOnly
                ? { background: "var(--accent)", color: "#fff" }
                : { background: "var(--surface)", color: "var(--accent)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 0.5px var(--separator)" }
            }
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            즐겨찾기
          </button>
        )}
        {categories.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className="shrink-0 px-3.5 py-2 rounded-full text-[14px] font-bold transition-colors"
              style={
                active
                  ? { background: "var(--text)", color: "var(--bg)" }
                  : { background: "var(--surface)", color: "var(--text)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 0.5px var(--separator)" }
              }
            >
              {c}
            </button>
          );
        })}

        <div className="ml-auto relative shrink-0">
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            className="px-3.5 py-2 rounded-full text-[13px] font-bold flex items-center gap-1"
            style={{ background: "var(--surface)", color: "var(--text-2)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 0.5px var(--separator)" }}
          >
            {SORT_LABEL[sort]}
            <Sym name="chevron.down" size={11} />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
              <div
                className="absolute right-0 mt-1 z-40 rounded-2xl overflow-hidden"
                style={{ minWidth: 140, background: "var(--surface)", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
              >
                {(Object.keys(SORT_LABEL) as Sort[]).map((sKey) => (
                  <button
                    key={sKey}
                    type="button"
                    onClick={() => { setSort(sKey); setSortOpen(false); }}
                    className="w-full text-left px-4 h-11 text-[14px] font-medium"
                    style={{ color: sort === sKey ? "var(--accent)" : "var(--text)" }}
                  >
                    {SORT_LABEL[sKey]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mood tag row */}
      {popularTags.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-[18px] pb-3.5 items-center">
          <div className="shrink-0 text-[11px] font-bold uppercase tracking-[0.4px]" style={{ color: "var(--text-2)" }}>
            분위기
          </div>
          {popularTags.map((tg) => {
            const on = tag === tg;
            return (
              <button
                key={tg}
                type="button"
                onClick={() => setTag(on ? null : tg)}
                className="shrink-0 px-2.5 py-1 rounded-full text-[12.5px] font-bold transition-colors"
                style={
                  on
                    ? { background: "var(--accent-soft)", color: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent)" }
                    : { background: "var(--surface)", color: "var(--text-2)", boxShadow: "inset 0 0 0 0.5px var(--separator)" }
                }
              >
                #{tg}
              </button>
            );
          })}
        </div>
      )}

      {/* Section rails — only on the unfiltered feed */}
      {!isFiltering && restaurants.length > 0 && (
        <div className="pt-1 pb-2">
          <HomeSections restaurants={restaurants} />
        </div>
      )}

      {/* Feed */}
      {filtered.length > 0 ? (
        <div className="px-[18px] pt-5">
          {!isFiltering && (
            <div className="flex items-end gap-2.5 mb-3">
              <div>
                <h2 className="font-display text-[21px] font-extrabold flex items-center gap-1.5">🆕 전체 기록</h2>
                <div className="text-[12.5px] mt-0.5" style={{ color: "var(--text-2)" }}>최근 추가한 순</div>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3.5">
            {(isFiltering ? filtered : recent).map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        </div>
      ) : (
        <NoResults onClear={() => { setQuery(""); setCategory("전체"); setTag(null); setFavoritesOnly(false); }} />
      )}
    </>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-8">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--bg-2)", color: "var(--text-2)" }}>
        <Sym name="magnifyingglass" size={24} />
      </div>
      <h2 className="font-display text-[18px] font-extrabold">검색 결과가 없어요</h2>
      <button type="button" onClick={onClear} className="mt-4 text-[14px] font-bold" style={{ color: "var(--accent)" }}>
        필터 초기화
      </button>
    </div>
  );
}
