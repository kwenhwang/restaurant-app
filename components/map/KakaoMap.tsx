"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { KakaoMapInstance } from "@/lib/kakao-maps";

interface MarkerData {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  category: string | null;
  rating: number | null;
}

interface Props {
  restaurants: MarkerData[];
}

const STARS = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];

function clusterStyle(size: number, bg: string) {
  return {
    width: `${size}px`,
    height: `${size}px`,
    background: bg,
    borderRadius: "50%",
    color: "#fff",
    textAlign: "center" as const,
    lineHeight: `${size}px`,
    fontSize: "14px",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  };
}

export default function KakaoMap({ restaurants }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<MarkerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapInstance = useRef<KakaoMapInstance | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}&libraries=clusterer&autoload=false`;
    script.async = true;

    const timeout = setTimeout(() => {
      if (!window.kakao?.maps) {
        setError("지도 SDK를 불러올 수 없어요");
      }
    }, 6000);

    script.onerror = () => {
      clearTimeout(timeout);
      setError("지도 SDK 로드 실패");
    };

    script.onload = () => {
      clearTimeout(timeout);
      if (!window.kakao?.maps) {
        setError("이 도메인은 카카오 개발자 콘솔에 등록되지 않았어요");
        return;
      }
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const center = restaurants[0]
          ? new window.kakao.maps.LatLng(restaurants[0].lat, restaurants[0].lng)
          : new window.kakao.maps.LatLng(37.5665, 126.978);

        const map = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 5,
        });
        mapInstance.current = map;

        // Build markers
        const markers = restaurants.map((r) => {
          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(r.lat, r.lng),
          });
          window.kakao.maps.event.addListener(marker, "click", () => {
            setSelected(r);
          });
          return marker;
        });

        // Use clusterer when many markers; otherwise place directly
        const kakaoMaps = window.kakao.maps as unknown as {
          MarkerClusterer?: new (opts: {
            map: KakaoMapInstance;
            averageCenter?: boolean;
            minLevel?: number;
            disableClickZoom?: boolean;
            calculator?: number[];
            styles?: object[];
          }) => { addMarkers: (m: object[]) => void };
        };

        if (markers.length >= 10 && kakaoMaps.MarkerClusterer) {
          const clusterer = new kakaoMaps.MarkerClusterer({
            map,
            averageCenter: true,
            minLevel: 6,
            calculator: [10, 30, 50, 100],
            styles: [
              clusterStyle(36, "#FF6F3D"),
              clusterStyle(42, "#FF6F3D"),
              clusterStyle(48, "#D94A1E"),
              clusterStyle(54, "#D94A1E"),
              clusterStyle(60, "#A83D17"),
            ],
          });
          clusterer.addMarkers(markers);
        } else {
          markers.forEach((m) => (m as unknown as { setMap: (m: KakaoMapInstance) => void }).setMap(map));
        }
      });
    };

    document.head.appendChild(script);

    return () => {
      clearTimeout(timeout);
      if (script.parentNode) document.head.removeChild(script);
    };
  }, [restaurants]);

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="w-full h-full" />

      {error && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          style={{ background: "var(--bg)" }}
        >
          <div className="text-[15px] font-semibold">{error}</div>
          <p className="text-[13px] mt-1.5" style={{ color: "var(--text-2)" }}>
            카카오 개발자 콘솔 → Web 플랫폼에 도메인을 추가해 주세요
          </p>
        </div>
      )}

      {selected && (
        <div
          className="absolute left-3 right-3 bottom-3 rounded-2xl bg-white p-4"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Link
                href={`/restaurants/${selected.id}`}
                className="text-[16px] font-bold truncate block"
              >
                {selected.name}
              </Link>
              <div className="flex items-center gap-1.5 mt-1">
                {selected.category && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: "var(--bg)", color: "var(--text-2)" }}
                  >
                    {selected.category}
                  </span>
                )}
                {selected.rating && (
                  <span className="text-[12px]" style={{ color: "var(--accent)" }}>
                    {STARS[selected.rating]}
                  </span>
                )}
              </div>
              {selected.address && (
                <p className="text-[12px] mt-1" style={{ color: "var(--text-2)" }}>
                  {selected.address}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="닫기"
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg)" }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
