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

export default function KakaoMap({ restaurants }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<MarkerData | null>(null);
  const mapInstance = useRef<KakaoMapInstance | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
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

        restaurants.forEach((r) => {
          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(r.lat, r.lng),
            map,
          });

          window.kakao.maps.event.addListener(marker, "click", () => {
            setSelected(r);
          });
        });
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [restaurants]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[60vh] rounded-xl overflow-hidden border" />

      {restaurants.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
          <p className="text-sm text-gray-400">좌표가 있는 맛집이 없어요</p>
        </div>
      )}

      {selected && (
        <div className="mt-3 bg-white rounded-xl border p-4">
          <div className="flex items-start justify-between">
            <div>
              <Link href={`/restaurants/${selected.id}`} className="font-semibold text-gray-900 hover:text-orange-500">
                {selected.name}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                {selected.category && (
                  <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                    {selected.category}
                  </span>
                )}
                {selected.rating && (
                  <span className="text-orange-400 text-xs">{STARS[selected.rating]}</span>
                )}
              </div>
              {selected.address && (
                <p className="text-xs text-gray-400 mt-1">{selected.address}</p>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
