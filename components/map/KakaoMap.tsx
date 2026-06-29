"use client";

// Rich map page — fullscreen, with category/favorite/wishlist filters,
// keyword search, current-location button, and a photo-rich selected card
// with directions link to Kakao Map.

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type {
  KakaoMapInstance,
  KakaoMarker,
  KakaoLatLng,
} from "@/lib/kakao-maps";
import Sym from "@/components/ui/Sym";
import { categoryStyle } from "@/lib/category-icons";
import { haptic } from "@/lib/haptic";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

export interface MarkerData {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  category: string | null;
  rating: number | null;
  is_favorite: boolean;
  is_wishlist: boolean;
  visit_count: number;
  last_visit: string | null;
  tier: 0 | 1 | 2 | null;
  storage_path: string | null;
  blur_data_url: string | null;
  phone: string | null;
  business_hours: Record<string, string> | null;
  note: string | null;
  price_range: string | null;
  menu_items: { name: string; price: string | null }[];
}

type QualityFilter = "all" | "top" | "rated4" | "fav" | "wish" | "unrated" | "tier0";

const WEEKDAY: ("sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat")[] = [
  "sun", "mon", "tue", "wed", "thu", "fri", "sat",
];
const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** Today's hours string, or null if not set. */
function todayHours(b: Record<string, string> | null): { label: string; open: boolean | null } | null {
  if (!b) return null;
  const now = new Date();
  const key = WEEKDAY[now.getDay()];
  const raw = b[key];
  if (!raw) return null;
  if (raw === "휴무") return { label: "오늘 휴무", open: false };
  const m = raw.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!m) return { label: raw, open: null };
  const open = Number(m[1]) * 60 + Number(m[2]);
  const close = Number(m[3]) * 60 + Number(m[4]);
  const cur = now.getHours() * 60 + now.getMinutes();
  const isOpen = close > open ? cur >= open && cur <= close : cur >= open || cur <= close;
  return { label: raw, open: isOpen };
}

function lastVisitLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return "오늘 방문";
  if (days < 7) return `${days}일 전 방문`;
  if (days < 30) return `${Math.floor(days / 7)}주 전 방문`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전 방문`;
  return `${Math.floor(days / 365)}년 전 방문`;
}

interface Props {
  restaurants: MarkerData[];
}

// SVG marker generator — returns a data URL. Color/size shift on
// favorite·rating·wishlist so the map reads at a glance.
function markerSvg(opts: {
  color: string;
  ring?: string;
  size: number;
  emoji?: string;
  dashed?: boolean;
}): string {
  const { color, ring = "#fff", size, emoji = "", dashed } = opts;
  const half = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 6}" viewBox="0 0 ${size} ${size + 6}">
    <defs>
      <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-opacity="0.32"/>
      </filter>
    </defs>
    <g filter="url(#s)">
      <circle cx="${half}" cy="${half}" r="${half - 2}" fill="${color}" stroke="${ring}" stroke-width="2" ${dashed ? 'stroke-dasharray="3 2"' : ""}/>
      <text x="${half}" y="${half + 5}" font-size="${size * 0.5}" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif">${emoji}</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function pickMarker(r: MarkerData) {
  const emoji = categoryStyle(r.category).emoji;
  const isTopRated = (r.rating ?? 0) >= 5;
  const isFrequent = r.visit_count >= 5;
  const big = r.is_favorite || isTopRated || isFrequent;
  const size = big ? 44 : 34;

  if (r.is_wishlist && r.visit_count === 0) {
    // Wishlist (not yet visited) — dashed ring, neutral fill
    return { url: markerSvg({ color: "#C9A07A", ring: "#fff", size: 36, emoji: "🔖", dashed: true }), size: 36 };
  }
  if (r.is_favorite) {
    return { url: markerSvg({ color: "#E5484D", ring: "#fff", size, emoji }), size };
  }
  if (isTopRated) {
    return { url: markerSvg({ color: "#D4AF37", ring: "#fff", size, emoji }), size };
  }
  return { url: markerSvg({ color: "#FF6F3D", ring: "#fff", size, emoji }), size };
}

const CATEGORIES = ["전체", "한식", "중식", "일식", "양식", "카페", "술집", "디저트", "기타"];

export default function KakaoMap({ restaurants }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<KakaoMapInstance | null>(null);
  const markersRef = useRef<{ id: string; marker: KakaoMarker }[]>([]);
  const meMarkerRef = useRef<KakaoMarker | null>(null);

  const [selected, setSelected] = useState<MarkerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const [category, setCategory] = useState<string>("전체");
  const [quality, setQuality] = useState<QualityFilter>("all");
  const [query, setQuery] = useState("");

  // viewport bounds (sw, ne) — updated on idle. Lets us flag off-screen markers.
  const [bounds, setBounds] = useState<{ sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } | null>(null);

  // Filter pipeline — drives which markers are visible.
  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      if (category !== "전체" && r.category !== category) return false;
      if (quality === "top" && (r.rating ?? 0) < 5) return false;
      if (quality === "rated4" && (r.rating ?? 0) < 4) return false;
      if (quality === "fav" && !r.is_favorite) return false;
      if (quality === "wish" && !r.is_wishlist) return false;
      if (quality === "unrated" && (r.rating != null || r.tier != null)) return false;
      if (quality === "tier0" && r.tier !== 0) return false;
      if (query.trim() && !r.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [restaurants, category, quality, query]);

  // Off-screen markers — projected onto the viewport edge so users see a hint.
  const offscreen = useMemo(() => {
    if (!bounds) return [];
    const cx = (bounds.sw.lng + bounds.ne.lng) / 2;
    const cy = (bounds.sw.lat + bounds.ne.lat) / 2;
    return filtered
      .map((r) => {
        const inside = r.lat >= bounds.sw.lat && r.lat <= bounds.ne.lat && r.lng >= bounds.sw.lng && r.lng <= bounds.ne.lng;
        if (inside) return null;
        // Bearing from viewport center (0=N, 90=E)
        const dx = r.lng - cx;
        const dy = r.lat - cy;
        const bearing = (Math.atan2(dx, dy) * 180) / Math.PI;
        // Haversine for distance display
        const R = 6371000;
        const dLat = ((r.lat - cy) * Math.PI) / 180;
        const dLng = ((r.lng - cx) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((cy * Math.PI) / 180) * Math.cos((r.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const meters = 2 * R * Math.asin(Math.sqrt(a));
        return { r, bearing, meters };
      })
      .filter((x): x is { r: MarkerData; bearing: number; meters: number } => x !== null)
      .sort((a, b) => a.meters - b.meters)
      .slice(0, 8); // cap so the rim doesn't get cluttered
  }, [filtered, bounds]);

  // 1) Load SDK + create map (once)
  useEffect(() => {
    if (typeof window === "undefined") return;

    function init() {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;
        const center = restaurants[0]
          ? new window.kakao.maps.LatLng(restaurants[0].lat, restaurants[0].lng)
          : new window.kakao.maps.LatLng(37.5665, 126.978);
        const map = new window.kakao.maps.Map(mapRef.current, { center, level: 5 });
        mapInstance.current = map;

        // Track viewport so off-screen markers can render as edge chips.
        const kakao = window.kakao.maps as unknown as {
          event: { addListener: (t: object, e: string, cb: () => void) => void };
        };
        const updateBounds = () => {
          const b = (map as unknown as {
            getBounds: () => {
              getSouthWest: () => { getLat: () => number; getLng: () => number };
              getNorthEast: () => { getLat: () => number; getLng: () => number };
            };
          }).getBounds();
          setBounds({
            sw: { lat: b.getSouthWest().getLat(), lng: b.getSouthWest().getLng() },
            ne: { lat: b.getNorthEast().getLat(), lng: b.getNorthEast().getLng() },
          });
        };
        kakao.event.addListener(map, "idle", updateBounds);
        setTimeout(updateBounds, 0); // initial

        setReady(true);
      });
    }

    if (window.kakao?.maps) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}&libraries=clusterer&autoload=false`;
    script.async = true;

    const t = setTimeout(() => {
      if (!window.kakao?.maps) setError("지도 SDK를 불러올 수 없어요");
    }, 6000);

    script.onerror = () => {
      clearTimeout(t);
      setError("지도 SDK 로드 실패");
    };
    script.onload = () => {
      clearTimeout(t);
      if (!window.kakao?.maps) {
        setError("카카오 콘솔에 도메인을 등록해 주세요");
        return;
      }
      init();
    };

    document.head.appendChild(script);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Re-place markers whenever filtered set changes
  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    const map = mapInstance.current;
    const kakao = window.kakao.maps as unknown as {
      LatLng: new (lat: number, lng: number) => KakaoLatLng;
      Marker: new (opts: object) => KakaoMarker;
      MarkerImage: new (
        src: string,
        size: { width: number; height: number },
        opts?: { offset?: object },
      ) => object;
      Size: new (w: number, h: number) => { width: number; height: number };
      Point: new (x: number, y: number) => object;
      event: { addListener: (t: object, e: string, cb: () => void) => void };
    };

    // Clear previous
    for (const { marker } of markersRef.current) marker.setMap(null);
    markersRef.current = [];

    for (const r of filtered) {
      const { url, size } = pickMarker(r);
      const img = new kakao.MarkerImage(url, new kakao.Size(size, size + 6), {
        offset: new kakao.Point(size / 2, size + 4),
      });
      const marker = new kakao.Marker({
        position: new kakao.LatLng(r.lat, r.lng),
        image: img,
      });
      kakao.event.addListener(marker, "click", () => {
        haptic("light");
        setSelected(r);
      });
      marker.setMap(map);
      markersRef.current.push({ id: r.id, marker });
    }
  }, [filtered, ready]);

  // 3) "내 위치" button — sniff permission first so we can give a clear hint
  //    when the browser has cached a 'denied' state and won't show a prompt.
  async function goToMyLocation() {
    if (!mapInstance.current) return;
    if (!navigator.geolocation) {
      setError("이 브라우저는 위치 기능을 지원하지 않아요");
      setTimeout(() => setError(null), 3500);
      return;
    }
    haptic("light");

    // Pre-check: if denied, the browser will fire the error callback without
    // re-prompting. Surface a real fix path instead of a generic toast.
    try {
      type PermStatus = { state: "granted" | "denied" | "prompt" };
      const perms = (navigator as Navigator & {
        permissions?: { query: (q: { name: string }) => Promise<PermStatus> };
      }).permissions;
      if (perms) {
        const status = await perms.query({ name: "geolocation" });
        if (status.state === "denied") {
          haptic("error");
          setError(
            "위치 권한이 차단됐어요. 주소창 자물쇠 → 권한 → 위치 → 허용 후 새로고침해 주세요.",
          );
          setTimeout(() => setError(null), 6000);
          return;
        }
      }
    } catch {
      // Permissions API unavailable (Safari iOS in some contexts) — fall through.
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latLng = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        mapInstance.current!.setCenter(latLng);
        if (meMarkerRef.current) meMarkerRef.current.setMap(null);
        const kakao = window.kakao.maps as unknown as {
          Marker: new (opts: object) => KakaoMarker;
          MarkerImage: new (s: string, sz: object, o?: object) => object;
          Size: new (w: number, h: number) => object;
          Point: new (x: number, y: number) => object;
        };
        const meSvg = markerSvg({ color: "#2563EB", ring: "#fff", size: 22 });
        const img = new kakao.MarkerImage(meSvg, new kakao.Size(22, 28), {
          offset: new kakao.Point(11, 26),
        });
        const me = new kakao.Marker({ position: latLng, image: img });
        me.setMap(mapInstance.current!);
        meMarkerRef.current = me;
      },
      (err) => {
        haptic("error");
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "위치 권한이 차단됐어요. 주소창 자물쇠 → 권한에서 허용으로 바꿔 주세요.",
          );
        } else if (err.code === err.TIMEOUT) {
          setError("위치 찾는 데 시간이 너무 걸려요");
        } else {
          setError("현재 위치를 알 수 없어요");
        }
        setTimeout(() => setError(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  const filterActive = category !== "전체" || quality !== "all" || query.trim() !== "";

  // Pan to a specific marker — used by the off-screen indicator chips.
  function panToMarker(r: MarkerData) {
    if (!mapInstance.current) return;
    haptic("light");
    mapInstance.current.setCenter(new window.kakao.maps.LatLng(r.lat, r.lng));
    setSelected(r);
  }

  // Fit all filtered markers into the viewport — "모두 보기" button.
  function fitAll() {
    if (!mapInstance.current || filtered.length === 0) return;
    haptic("light");
    const kakao = window.kakao.maps as unknown as {
      LatLngBounds: new () => {
        extend: (latlng: KakaoLatLng) => void;
      };
      LatLng: new (lat: number, lng: number) => KakaoLatLng;
    };
    const b = new kakao.LatLngBounds();
    for (const r of filtered) b.extend(new kakao.LatLng(r.lat, r.lng));
    (mapInstance.current as unknown as { setBounds: (b: object, p?: number) => void }).setBounds(b, 40);
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Top overlay: search + filter chips */}
      <div
        className="absolute left-3 right-3 z-10 flex flex-col gap-2"
        style={{ top: "max(12px, env(safe-area-inset-top, 12px))" }}
      >
        <div
          className="flex items-center gap-2 px-3 h-11 rounded-full"
          style={{
            background: "var(--surface)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Sym name="magnifyingglass" size={16} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`내 가게 ${restaurants.length}곳에서 검색`}
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ color: "var(--text)" }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="지우기"
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg)" }}
            >
              <Sym name="xmark" size={11} />
            </button>
          )}
        </div>

        <div
          className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className="shrink-0 h-8 px-3 rounded-full text-[12.5px] font-bold whitespace-nowrap transition-transform active:scale-95"
              style={{
                background: category === c ? "var(--accent)" : "var(--surface)",
                color: category === c ? "white" : "var(--text)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Quality filters — single-select pills based on my own evaluation */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          {([
            { k: "all", label: "전체", color: "var(--accent)" },
            { k: "fav", label: "♥ 즐겨찾기", color: "#E5484D" },
            { k: "top", label: "⭐ 5점", color: "#D4AF37" },
            { k: "rated4", label: "⭐ 4점+", color: "#D4AF37" },
            { k: "tier0", label: "🟢 좋아함", color: "#22A06B" },
            { k: "wish", label: "🔖 아직 안 간 곳", color: "#C9A07A" },
            { k: "unrated", label: "❔ 평가 안 함", color: "#6B7280" },
          ] as { k: QualityFilter; label: string; color: string }[]).map((f) => (
            <button
              key={f.k}
              type="button"
              onClick={() => setQuality(f.k)}
              aria-pressed={quality === f.k}
              className="shrink-0 h-8 px-3 rounded-full text-[12.5px] font-bold whitespace-nowrap transition-transform active:scale-95"
              style={{
                background: quality === f.k ? f.color : "var(--surface)",
                color: quality === f.k ? "white" : "var(--text)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filterActive && (
          <div className="self-start text-[11.5px] font-semibold px-3 py-1 rounded-full"
               style={{ background: "rgba(20,16,12,0.62)", color: "white", backdropFilter: "blur(8px)" }}>
            {filtered.length}곳 표시 중
          </div>
        )}
      </div>

      {/* Floating buttons (right) */}
      <div className="absolute right-3 flex flex-col gap-2 z-10" style={{ bottom: selected ? "calc(62% + 16px)" : 24 }}>
        {filtered.length > 0 && (
          <button
            type="button"
            onClick={fitAll}
            aria-label="모두 보기"
            className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{
              background: "var(--surface)",
              boxShadow: "0 8px 22px rgba(0,0,0,0.16)",
            }}
          >
            <Sym name="map" size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={goToMyLocation}
          aria-label="내 위치로 이동"
          className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
          style={{
            background: "var(--surface)",
            boxShadow: "0 8px 22px rgba(0,0,0,0.16)",
          }}
        >
          <Sym name="location.fill" size={20} />
        </button>
      </div>

      {/* Off-screen indicators — chip on the rim showing direction + distance.
          Game-style minimap pattern: bearing 0° = top, 90° = right, etc.
          Each chip is positioned by translating along (sin·θ, -cos·θ) from
          viewport center, then clamped to the rim with a ~36px inset. */}
      {!selected && offscreen.map(({ r, bearing, meters }) => {
        const rad = (bearing * Math.PI) / 180;
        const sx = Math.sin(rad);
        const sy = -Math.cos(rad);
        // Clamp to a rounded-rect rim: pick the larger axis so the chip sits
        // on whichever edge the bearing points to.
        const a = Math.max(Math.abs(sx), Math.abs(sy));
        const ux = sx / a;
        const uy = sy / a;
        // Viewport halves minus inset; lays the chip just inside the edge.
        const insetTop = 130; // clear search + chips overlay
        const insetBottom = 24;
        const insetSide = 12;
        const left = `calc(50% + ${ux * 50}vw - 36px - ${ux * insetSide}px)`;
        const top = `calc(${insetTop}px + (100vh - ${insetTop + insetBottom + 96}px) * ${(uy + 1) / 2})`;
        const kmLabel = meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`;
        const emoji = categoryStyle(r.category).emoji;
        const color = r.is_favorite ? "#E5484D" : (r.rating ?? 0) >= 5 ? "#D4AF37" : "var(--accent)";
        // Arrow rotation: 0deg points up, bearing 0 = north (up in our screen)
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => panToMarker(r)}
            aria-label={`${r.name}으로 이동 — ${kmLabel}`}
            className="absolute z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold text-white whitespace-nowrap transition-transform active:scale-90 animate-fade-up"
            style={{
              left,
              top,
              background: color,
              boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
              maxWidth: 132,
            }}
          >
            <span
              aria-hidden
              style={{
                display: "inline-block",
                transform: `rotate(${bearing}deg)`,
                fontSize: 10,
                lineHeight: 1,
              }}
            >
              ➤
            </span>
            <span>{emoji}</span>
            <span className="truncate">{r.name}</span>
            <span style={{ opacity: 0.85 }}>· {kmLabel}</span>
          </button>
        );
      })}

      {/* Error toast */}
      {error && (
        <div
          className="absolute inset-x-3 z-20 px-4 py-3 rounded-2xl text-[13px] font-semibold text-center"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(20,16,12,0.86)",
            color: "white",
            backdropFilter: "blur(10px)",
          }}
        >
          {error}
        </div>
      )}

      {/* Empty filter state */}
      {ready && filtered.length === 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[12.5px] font-semibold"
          style={{
            top: 130,
            background: "rgba(20,16,12,0.78)",
            color: "white",
            backdropFilter: "blur(8px)",
          }}
        >
          조건에 맞는 가게가 없어요
        </div>
      )}

      {/* Selected sheet */}
      {selected && (
        <div
          className="absolute left-2 right-2 z-10 overflow-hidden rounded-3xl animate-fade-up"
          style={{
            bottom: 12,
            background: "var(--surface)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
            maxHeight: "62%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Hero photo */}
          <div className="relative w-full shrink-0" style={{ height: 140 }}>
            {selected.storage_path ? (
              <Image
                src={`${IMAGE_BASE}/${selected.storage_path}`}
                alt={selected.name}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
                {...(selected.blur_data_url
                  ? { placeholder: "blur" as const, blurDataURL: selected.blur_data_url }
                  : {})}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-[64px]"
                style={{ background: categoryStyle(selected.category).gradient }}
              >
                {categoryStyle(selected.category).emoji}
              </div>
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,0.55) 100%)" }} />
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="닫기"
              className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ background: "rgba(20,16,12,0.46)", backdropFilter: "blur(8px)" }}
            >
              <Sym name="xmark" size={14} />
            </button>
            <div className="absolute left-3 right-12 bottom-2 text-white">
              <Link
                href={`/restaurants/${selected.id}`}
                className="font-display text-[20px] font-black truncate block"
                style={{ letterSpacing: "-0.3px", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
              >
                {selected.name}
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5 text-[12px] font-semibold">
                {selected.category && (
                  <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(6px)" }}>
                    {categoryStyle(selected.category).emoji} {selected.category}
                  </span>
                )}
                {selected.rating != null && selected.rating > 0 && (
                  <span style={{ color: "#FFD56B" }}>⭐ {selected.rating}</span>
                )}
                {selected.is_favorite && <span style={{ color: "#FFA0A0" }}>♥</span>}
                {selected.is_wishlist && <span style={{ color: "#E5C9A2" }}>🔖</span>}
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto px-4 py-3 space-y-2.5 text-[13px]" style={{ color: "var(--text)" }}>
            {/* Visit + hours row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: "var(--text-2)" }}>
              {selected.visit_count > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold">
                  🍴 {selected.visit_count}회 방문
                </span>
              )}
              {lastVisitLabel(selected.last_visit) && (
                <span>· {lastVisitLabel(selected.last_visit)}</span>
              )}
              {(() => {
                const th = todayHours(selected.business_hours);
                if (!th) return null;
                const color = th.open === false ? "var(--text-3)" : th.open ? "#22A06B" : "var(--text-2)";
                const label = th.open === true ? `영업 중 · ${th.label}` : th.open === false ? th.label : `오늘 ${th.label}`;
                return <span style={{ color }}>· 🕘 {label}</span>;
              })()}
            </div>

            {selected.address && (
              <div className="flex items-start gap-2 text-[12.5px]" style={{ color: "var(--text-2)" }}>
                <Sym name="mappin" size={13} strokeWidth={2} />
                <span className="flex-1">{selected.address}</span>
              </div>
            )}

            {selected.phone && (
              <a
                href={`tel:${selected.phone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-2 text-[12.5px] font-semibold"
                style={{ color: "var(--accent-press)" }}
              >
                <Sym name="phone.fill" size={13} /> {selected.phone}
              </a>
            )}

            {(selected.price_range || selected.menu_items.length > 0) && (
              <div className="rounded-xl p-2.5 mt-1" style={{ background: "var(--bg)" }}>
                {selected.price_range && (
                  <div className="text-[11px] font-bold mb-1" style={{ color: "var(--text-2)" }}>
                    가격대 <span className="font-black tabular-nums" style={{ color: "var(--accent-press)" }}>{selected.price_range}</span>
                  </div>
                )}
                {selected.menu_items.slice(0, 3).map((it, i) => (
                  <div key={i} className="flex justify-between text-[12.5px] py-0.5">
                    <span className="truncate" style={{ color: "var(--text)" }}>{it.name}</span>
                    {it.price && <span className="tabular-nums shrink-0 ml-2" style={{ color: "var(--text-2)" }}>{it.price}</span>}
                  </div>
                ))}
              </div>
            )}

            {selected.note && (
              <p
                className="font-display text-[13.5px] leading-relaxed line-clamp-3 italic"
                style={{ color: "var(--text)", borderLeft: "2px solid var(--accent)", paddingLeft: 10 }}
              >
                {selected.note}
              </p>
            )}
          </div>

          {/* Action row */}
          <div className="flex gap-1.5 px-3 py-3 shrink-0" style={{ borderTop: "0.5px solid var(--separator)" }}>
            <a
              href={`https://map.kakao.com/link/to/${encodeURIComponent(selected.name)},${selected.lat},${selected.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 rounded-xl text-[13.5px] font-bold flex items-center justify-center gap-1.5 text-white"
              style={{ background: "var(--accent)" }}
              onClick={() => haptic("light")}
            >
              <Sym name="arrow.up.right" size={13} strokeWidth={2.4} />
              길찾기
            </a>
            <Link
              href={`/restaurants/${selected.id}`}
              className="flex-1 h-11 rounded-xl text-[13.5px] font-bold flex items-center justify-center"
              style={{ background: "var(--bg)", color: "var(--text)" }}
            >
              상세 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
