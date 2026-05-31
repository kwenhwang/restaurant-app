"use client";

// components/home/AIRecommend.tsx — v3 (A2)
// Same data-fetching/caching/location logic as v2. Re-skinned as a hero:
// full-bleed photo recommendation cards that swipe horizontally and fill the
// top third of the home screen. Empty photo → category emoji + gradient.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Sym from "@/components/ui/Sym";
import CategoryPlaceholder from "@/components/restaurants/CategoryPlaceholder";
import { categoryStyle } from "@/lib/category-icons";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

interface Recommendation {
  restaurantId: string;
  reason: string;
}
interface AIResult {
  greeting: string;
  recommendations: Recommendation[];
}
interface Image {
  id: string;
  storage_path: string;
  is_primary?: boolean;
}
interface RestaurantLite {
  id: string;
  name: string;
  category?: string | null;
  rating?: number | null;
  images?: Image[];
}
interface Props {
  restaurants: RestaurantLite[];
}

const STORAGE_KEY = "ai-recommend-cache";
const TTL_MS = 10 * 60 * 1000;

function getCachedLocation(): { lat: number; lng: number } | null {
  try {
    const raw = sessionStorage.getItem("user-location");
    if (!raw) return null;
    const { lat, lng, t } = JSON.parse(raw);
    if (Date.now() - t > 5 * 60 * 1000) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
function saveLocation(lat: number, lng: number) {
  try {
    sessionStorage.setItem("user-location", JSON.stringify({ lat, lng, t: Date.now() }));
  } catch {}
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "야식 한 끼 어때요?";
  if (h < 11) return "아침 든든하게 시작해요";
  if (h < 14) return "오늘 점심은 어디로?";
  if (h < 17) return "커피 한 잔 어울리는 시간";
  if (h < 21) return "오늘 저녁은 뭘 먹을까요?";
  return "가볍게 한잔 어때요?";
}

export default function AIRecommend({ restaurants }: Props) {
  const [data, setData] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (restaurants.length === 0) {
      setLoading(false);
      return;
    }
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
      let coord = getCachedLocation();
      if (!coord && navigator.geolocation) {
        coord = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              saveLocation(c.lat, c.lng);
              resolve(c);
            },
            () => resolve(null),
            { timeout: 4000, maximumAge: 5 * 60 * 1000 }
          );
        });
      }
      const url = coord ? `/api/ai/recommend?lat=${coord.lat}&lng=${coord.lng}` : "/api/ai/recommend";
      const res = await fetch(url, { cache: force ? "no-store" : "default" });
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

  if (restaurants.length < 2) return null;

  const byId = new Map(restaurants.map((r) => [r.id, r]));
  const recs = (data?.recommendations ?? []).filter((r) => byId.has(r.restaurantId)).slice(0, 3);
  const q = timeGreeting();

  return (
    <section className="pb-1">
      <div className="px-[18px] flex items-center gap-1.5 mb-3">
        <Sym name="sparkle" size={15} className="text-accent" />
        <span className="text-[11.5px] font-extrabold uppercase tracking-[1px]" style={{ color: "var(--accent)" }}>
          오늘의 추천
        </span>
        <span className="ml-auto text-[12.5px]" style={{ color: "var(--text-2)" }}>
          {data?.greeting ? data.greeting.slice(0, 16) : "지금 위치 기준"}
        </span>
        <button
          type="button"
          onClick={() => fetchData(true)}
          disabled={loading}
          aria-label="새로고침"
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: loading ? "spin 0.8s linear infinite" : undefined }}>
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {loading && !data ? (
        <div className="px-[18px]">
          <div className="skeleton" style={{ height: 232, borderRadius: "var(--r-card)" }} />
        </div>
      ) : error ? (
        <p className="px-[18px] text-[13px]" style={{ color: "var(--text-2)" }}>{error}</p>
      ) : recs.length === 0 ? (
        <p className="px-[18px] text-[13px]" style={{ color: "var(--text-2)" }}>
          지금 딱 맞는 곳이 떠오르지 않아요. 새로고침 해보세요.
        </p>
      ) : (
        <>
          <div
            ref={railRef}
            onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="flex gap-3 overflow-x-auto no-scrollbar px-[18px]"
            style={{ scrollSnapType: "x mandatory", scrollPaddingLeft: 18 }}
          >
            {recs.map((rec) => {
              const r = byId.get(rec.restaurantId)!;
              return <HeroCard key={rec.restaurantId} r={r} reason={rec.reason} q={q} />;
            })}
          </div>
          {recs.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {recs.map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: i === idx ? 18 : 6, height: 6, borderRadius: 999,
                    background: i === idx ? "var(--accent)" : "var(--text-3)", transition: "all .25s",
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function HeroCard({ r, reason, q }: { r: RestaurantLite; reason: string; q: string }) {
  const primary = r.images?.find((i) => i.is_primary) ?? r.images?.[0];
  const s = categoryStyle(r.category);
  return (
    <Link
      href={`/restaurants/${r.id}`}
      className="block shrink-0 overflow-hidden transition-transform active:scale-[0.98] relative"
      style={{ width: "calc(100% - 26px)", height: 232, borderRadius: "var(--r-card)", scrollSnapAlign: "start", boxShadow: "var(--shadow-photo)" }}
    >
      {primary ? (
        <Image src={`${IMAGE_BASE}/${primary.storage_path}`} alt={r.name} fill sizes="100vw" className="object-cover" priority />
      ) : (
        <CategoryPlaceholder category={r.category} size="hero" />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0) 35%,rgba(20,14,8,0.78) 100%)" }} />
      <div className="absolute top-3.5 left-3.5 right-3.5 flex justify-between items-start">
        <span className="px-3 py-1.5 rounded-full text-[12px] font-semibold text-white" style={{ background: "rgba(20,16,12,0.42)", backdropFilter: "blur(8px)" }}>
          {q}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[12px] text-white" style={{ background: "rgba(20,16,12,0.55)", backdropFilter: "blur(10px)" }}>
          <Sym name="star.fill" size={12} className="text-accent" />
          <span className="font-extrabold text-[14px] tabular-nums">{r.rating ? r.rating.toFixed(1) : "—"}</span>
        </span>
      </div>
      <div className="absolute left-4 right-4 bottom-4 text-white">
        <span className="inline-block px-2.5 py-1 rounded-full text-[11.5px] font-bold mb-2" style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(6px)" }}>
          {s.emoji} {r.category}
        </span>
        <h3 className="font-display text-[28px] font-extrabold" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>{r.name}</h3>
        <p className="text-[13.5px] mt-1.5 leading-snug" style={{ color: "rgba(255,255,255,0.92)" }}>{reason}</p>
      </div>
    </Link>
  );
}
