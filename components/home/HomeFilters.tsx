"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import RestaurantCard from "@/components/restaurants/RestaurantCard";
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
  created_at?: string;
  images?: Image[];
}

interface Props {
  restaurants: RestaurantItem[];
  categories: string[];
}

type Sort = "recent" | "rating" | "name";

const SORT_LABEL: Record<Sort, string> = {
  recent: "최신순",
  rating: "평점순",
  name: "이름순",
};

export default function HomeFilters({ restaurants, categories }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("전체");
  const [sort, setSort] = useState<Sort>("recent");
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = restaurants;

    if (category !== "전체") {
      list = list.filter((r) => r.category === category);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.address ?? "").toLowerCase().includes(q) ||
          (r.category ?? "").toLowerCase().includes(q)
      );
    }

    const sorted = [...list];
    if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    } else if (sort === "rating") {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else {
      sorted.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }
    return sorted;
  }, [restaurants, query, category, sort]);

  return (
    <>
      {/* Search */}
      <div className="px-5 pb-3">
        <div
          className="h-10 rounded-[12px] flex items-center gap-1.5 px-2.5"
          style={{ background: "rgba(118,118,128,0.12)" }}
        >
          <span style={{ color: "var(--text-2)" }}>
            <Sym name="magnifyingglass" size={17} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="가게 이름, 주소, 카테고리"
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

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3.5 items-center">
        {categories.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className="shrink-0 px-3.5 py-2 rounded-full text-[14px] font-semibold transition-colors"
              style={
                active
                  ? { background: "var(--text)", color: "#fff" }
                  : {
                      background: "#fff",
                      color: "var(--text)",
                      boxShadow:
                        "0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(0,0,0,0.06)",
                    }
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
            className="px-3.5 py-2 rounded-full text-[13px] font-semibold flex items-center gap-1"
            style={{
              background: "#fff",
              color: "var(--text-2)",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(0,0,0,0.06)",
            }}
          >
            {SORT_LABEL[sort]}
            <span style={{ fontSize: 9 }}>▼</span>
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
              <div
                className="absolute right-0 mt-1 z-40 rounded-2xl overflow-hidden bg-white"
                style={{
                  minWidth: 140,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                }}
              >
                {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSort(s);
                      setSortOpen(false);
                    }}
                    className="w-full text-left px-4 h-11 text-[14px] font-medium"
                    style={{
                      color: sort === s ? "var(--accent)" : "var(--text)",
                    }}
                  >
                    {SORT_LABEL[s]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="px-4 flex flex-col gap-2.5">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <EmptyState />
      ) : (
        <NoResults onClear={() => { setQuery(""); setCategory("전체"); }} />
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center py-20 px-8">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <Sym name="fork.knife" size={28} strokeWidth={2} />
      </div>
      <h2 className="text-[17px] font-bold">아직 기록된 맛집이 없어요</h2>
      <p className="text-[14px] mt-1.5 max-w-[260px]" style={{ color: "var(--text-2)" }}>
        오늘 다녀온 그 가게부터 한 곳씩, 나만의 미식 지도를 만들어 보세요.
      </p>
      <Link
        href="/restaurants/new"
        className="mt-6 inline-flex items-center gap-1.5 h-11 px-5 rounded-full text-[15px] font-semibold text-white"
        style={{ background: "var(--accent)" }}
      >
        <Sym name="plus" size={16} strokeWidth={2.4} />
        첫 번째 맛집 추가
      </Link>
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-8">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: "var(--bg)", color: "var(--text-2)" }}
      >
        <Sym name="magnifyingglass" size={24} />
      </div>
      <h2 className="text-[16px] font-bold">검색 결과가 없어요</h2>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 text-[14px] font-semibold"
        style={{ color: "var(--accent)" }}
      >
        필터 초기화
      </button>
    </div>
  );
}
