"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Recommendation {
  restaurantId: string;
  reason: string;
}

interface AIResult {
  greeting: string;
  recommendations: Recommendation[];
}

interface RestaurantLite {
  id: string;
  name: string;
  category?: string | null;
  rating?: number | null;
}

interface Props {
  restaurants: RestaurantLite[];
}

const STORAGE_KEY = "ai-recommend-cache";
const TTL_MS = 60 * 60 * 1000; // 1 hour

export default function AIRecommend({ restaurants }: Props) {
  const [data, setData] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurants.length === 0) {
      setLoading(false);
      return;
    }
    // Try cache first
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < TTL_MS) {
          setData(parsed.data);
          setLoading(false);
          return;
        }
      }
    } catch {}
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData(force = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/recommend", { cache: force ? "no-store" : "default" });
      if (!res.ok) throw new Error("추천을 불러올 수 없어요");
      const json: AIResult = await res.json();
      setData(json);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: json, timestamp: Date.now() }));
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }

  if (restaurants.length < 2) return null; // need at least a couple to recommend

  const byId = new Map(restaurants.map((r) => [r.id, r]));
  const recs = (data?.recommendations ?? []).filter((r) => byId.has(r.restaurantId));

  return (
    <section className="px-4 pb-3">
      <div
        className="rounded-[22px] p-4 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,111,61,0.08) 0%, rgba(217,74,30,0.04) 100%)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 0.5px var(--separator)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <SparkleIcon />
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              AI 추천
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={loading}
            aria-label="새로고침"
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,111,61,0.1)", color: "var(--accent)" }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: loading ? "spin 0.8s linear infinite" : undefined,
              }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>

        {loading && !data && (
          <div className="space-y-2 mt-1">
            <div className="h-4 w-3/4 rounded-md" style={{ background: "var(--bg)" }} />
            <div className="h-3 w-5/6 rounded-md" style={{ background: "var(--bg)" }} />
            <div className="h-3 w-2/3 rounded-md" style={{ background: "var(--bg)" }} />
          </div>
        )}

        {error && !loading && (
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
            {error}
          </p>
        )}

        {data && (
          <>
            <p
              className="text-[15px] font-bold mb-3"
              style={{ letterSpacing: "-0.3px" }}
            >
              {data.greeting}
            </p>
            {recs.length === 0 ? (
              <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
                지금 딱 맞는 곳이 떠오르지 않아요. 새로고침 해보세요.
              </p>
            ) : (
              <div className="space-y-2">
                {recs.map((rec) => {
                  const r = byId.get(rec.restaurantId)!;
                  return (
                    <Link
                      key={rec.restaurantId}
                      href={`/restaurants/${rec.restaurantId}`}
                      className="block rounded-[14px] bg-white p-3 transition-transform active:scale-[0.99]"
                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-bold truncate">
                            {r.name}
                          </div>
                          {r.category && (
                            <div
                              className="text-[12px]"
                              style={{ color: "var(--text-2)" }}
                            >
                              {r.category}
                            </div>
                          )}
                        </div>
                        {r.rating && (
                          <span
                            className="text-[12px] font-bold shrink-0"
                            style={{ color: "var(--accent)" }}
                          >
                            ★ {r.rating}.0
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[13px] mt-1.5 leading-snug"
                        style={{ color: "var(--text-2)" }}
                      >
                        {rec.reason}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ color: "var(--accent)" }}
    >
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2zM5 16l.75 2.75L8.5 19.5l-2.75.75L5 23l-.75-2.75L1.5 19.5l2.75-.75L5 16zM19 14l.75 2.75L22.5 17.5l-2.75.75L19 21l-.75-2.75L15.5 17.5l2.75-.75L19 14z" />
    </svg>
  );
}
