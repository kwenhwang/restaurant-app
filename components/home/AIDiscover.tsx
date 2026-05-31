"use client";

// AI 친구 큐레이션 — Discovery section on home.
// Loads on demand (button tap), reuses session storage so the user doesn't
// re-spend Gemini grounding quota when they navigate away and back.

import { useState } from "react";
import Sym from "@/components/ui/Sym";
import { categoryStyle } from "@/lib/category-icons";

interface Pick {
  name: string;
  category: string;
  area: string;
  reason: string;
}

interface ApiResult {
  picks: Pick[];
  sources?: { url: string; title?: string }[];
  area?: string;
}

const CACHE_KEY = "ai-discover:result";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

function loadCache(): { ts: number; data: ApiResult } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (Date.now() - j.ts < CACHE_TTL_MS) return j;
  } catch {}
  return null;
}

function saveCache(data: ApiResult) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

export default function AIDiscover() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResult | null>(() => loadCache()?.data ?? null);
  const [error, setError] = useState<string | null>(null);

  async function fetchPicks() {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/ai/discover";
      try {
        const pos = await new Promise<GeolocationPosition | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p),
            () => resolve(null),
            { timeout: 4000, maximumAge: 600000 },
          );
        });
        if (pos) {
          url += `?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`;
        }
      } catch {}

      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as ApiResult & { error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "추천 실패");
      setData(json);
      saveCache(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="px-[18px] mt-7">
      <div className="flex items-end justify-between mb-2.5 px-0.5">
        <h2 className="font-display text-[18px] font-extrabold flex items-center gap-1.5">
          <span style={{ color: "var(--accent)" }}>
            <Sym name="sparkles" size={16} />
          </span>
          AI 친구의 발견
        </h2>
        <button
          type="button"
          onClick={fetchPicks}
          disabled={loading}
          className="text-[12px] font-bold"
          style={{ color: "var(--accent)" }}
        >
          {loading ? "찾는 중…" : data ? "다시 추천" : "추천 받기"}
        </button>
      </div>

      {!data && !error && !loading && (
        <div
          className="rounded-2xl p-4 text-[13.5px]"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)", color: "var(--text-2)" }}
        >
          내 취향과 자주 가는 지역을 분석해서 새로운 맛집을 찾아드려요.
          <br />
          위의 “추천 받기”를 눌러보세요.
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-3 animate-pulse"
              style={{ background: "var(--surface)", height: 84 }}
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <div
          className="rounded-2xl p-4 text-[13px]"
          style={{ background: "var(--surface)", color: "var(--text-2)" }}
        >
          ⚠️ {error}
        </div>
      )}

      {data && data.picks.length > 0 && (
        <div className="space-y-2.5">
          {data.picks.map((p, i) => {
            const s = categoryStyle(p.category);
            const search = encodeURIComponent(`${p.name} ${p.area}`);
            return (
              <a
                key={`${p.name}-${i}`}
                href={`https://map.kakao.com/?q=${search}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl overflow-hidden flex items-stretch transition-transform active:scale-[0.99]"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
              >
                <div
                  className="shrink-0 flex items-center justify-center text-[32px]"
                  style={{ width: 64, background: s.gradient }}
                >
                  {s.emoji}
                </div>
                <div className="flex-1 py-2.5 px-3 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: "var(--bg)", color: "var(--text-2)" }}
                    >
                      #{i + 1}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--text-2)" }}>
                      {p.area} · {p.category}
                    </span>
                  </div>
                  <div className="font-display text-[16px] font-extrabold truncate mt-0.5">
                    {p.name}
                  </div>
                  <p className="text-[12.5px] mt-0.5 leading-snug line-clamp-2" style={{ color: "var(--text-2)" }}>
                    {p.reason}
                  </p>
                </div>
                <div
                  className="shrink-0 flex items-center pr-3"
                  style={{ color: "var(--text-3)" }}
                >
                  <Sym name="arrow.up.right" size={14} />
                </div>
              </a>
            );
          })}
          {data.sources && data.sources.length > 0 && (
            <div className="flex flex-wrap gap-1 px-1 pt-1">
              <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                출처:
              </span>
              {data.sources.slice(0, 4).map((s, i) => {
                let host = "";
                try {
                  host = new URL(s.url).hostname.replace(/^www\./, "");
                } catch {}
                return (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px]"
                    style={{ color: "var(--text-3)" }}
                  >
                    ↗ {host || `링크${i + 1}`}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
