"use client";

import { useEffect, useRef, useState } from "react";
import type { KakaoMapInstance, KakaoMarker } from "@/lib/kakao-maps";

interface SearchResult {
  name: string;
  address: string;
  category: string;
  lat: number;
  lng: number;
}

interface Props {
  name?: string;
  initialAddress?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onChange?: (v: { address: string; lat: number | null; lng: number | null; name?: string }) => void;
}

export default function LocationPicker({ name: initialName, initialAddress, initialLat, initialLng, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [address, setAddress] = useState(initialAddress ?? "");
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [name, setName] = useState(initialName ?? "");
  const [locating, setLocating] = useState(false);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);

  useEffect(() => {
    onChange?.({ address, lat, lng, name });
  }, [address, lat, lng, name, onChange]);

  useEffect(() => {
    if (window.kakao?.maps) {
      initMap();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk]');
    if (existing) {
      existing.addEventListener("load", () => window.kakao.maps.load(initMap));
      return;
    }
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}&autoload=false`;
    script.async = true;
    script.dataset.kakaoSdk = "1";
    script.onload = () => window.kakao.maps.load(initMap);
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initMap() {
    if (!mapEl.current || mapRef.current) return;
    const start = lat && lng
      ? new window.kakao.maps.LatLng(lat, lng)
      : new window.kakao.maps.LatLng(37.5665, 126.978);
    const map = new window.kakao.maps.Map(mapEl.current, { center: start, level: 4 });
    mapRef.current = map;

    if (lat && lng) {
      markerRef.current = new window.kakao.maps.Marker({ position: start, map });
    }

    window.kakao.maps.event.addListener(map, "click", (e) => {
      if (!e?.latLng) return;
      const newLat = e.latLng.getLat();
      const newLng = e.latLng.getLng();
      setLat(newLat);
      setLng(newLng);
      const pos = new window.kakao.maps.LatLng(newLat, newLng);
      if (markerRef.current) markerRef.current.setPosition(pos);
      else markerRef.current = new window.kakao.maps.Marker({ position: pos, map });
    });
  }

  function moveMarker(newLat: number, newLng: number) {
    if (!mapRef.current) return;
    const pos = new window.kakao.maps.LatLng(newLat, newLng);
    mapRef.current.setCenter(pos);
    if (markerRef.current) markerRef.current.setPosition(pos);
    else markerRef.current = new window.kakao.maps.Marker({ position: pos, map: mapRef.current });
  }

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(`/api/kakao/keyword?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setSearching(false);
    }
  }

  function pickResult(r: SearchResult) {
    setName(r.name);
    setAddress(r.address);
    setLat(r.lat);
    setLng(r.lng);
    setResults([]);
    setQuery("");
    moveMarker(r.lat, r.lng);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 기능을 지원하지 않아요");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        moveMarker(newLat, newLng);
        setLocating(false);
      },
      (err) => {
        alert("위치를 가져올 수 없어요: " + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }}
          placeholder="장소명 또는 주소 검색"
          className="flex-1 rounded-2xl px-4 py-2.5 text-[15px] outline-none"
          style={{ background: "var(--bg)" }}
        />
        <button
          type="button"
          onClick={search}
          disabled={searching}
          className="px-4 rounded-2xl text-[14px] font-semibold disabled:opacity-50"
          style={{ background: "var(--accent)", color: "white" }}
        >
          {searching ? "..." : "검색"}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="rounded-2xl overflow-hidden divide-y" style={{ background: "var(--bg)", borderColor: "var(--separator)" }}>
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pickResult(r)}
                className="w-full text-left px-4 py-3 hover:opacity-80"
              >
                <div className="text-[15px] font-semibold">{r.name}</div>
                <div className="text-[12px]" style={{ color: "var(--text-2)" }}>{r.address || r.category}</div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className="w-full rounded-2xl py-2.5 text-[14px] font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
        {locating ? "위치 찾는 중..." : "현재 위치 사용"}
      </button>

      <div className="relative">
        <div ref={mapEl} className="w-full h-[280px] rounded-2xl overflow-hidden" />
        <p className="text-[12px] mt-1.5" style={{ color: "var(--text-2)" }}>
          지도를 탭하면 위치가 바뀌어요
        </p>
      </div>

      {lat && lng && (
        <div className="rounded-2xl px-4 py-2.5 text-[13px]" style={{ background: "var(--bg)" }}>
          <div style={{ color: "var(--text-2)" }}>선택된 위치</div>
          <div className="font-mono mt-0.5">{lat.toFixed(6)}, {lng.toFixed(6)}</div>
          {address && <div className="mt-1" style={{ color: "var(--text-2)" }}>{address}</div>}
        </div>
      )}
    </div>
  );
}
