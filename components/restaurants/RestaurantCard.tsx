// components/restaurants/RestaurantCard.tsx — v2
// Adds: rank badge (top-right) · visit count + relative time line · inline tags.

import Link from "next/link";
import Image from "next/image";
import Sym from "@/components/ui/Sym";
import Stars from "@/components/ui/Stars";
import RankBadge from "@/components/restaurants/RankBadge";
import { categoryStyle } from "@/lib/category-icons";
import { relativeTime } from "@/lib/relative-time";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

type Image = { id: string; storage_path: string; is_primary?: boolean };
type Restaurant = {
  id: string;
  name: string;
  category?: string | null;
  rating?: number | null;
  address?: string | null;
  is_favorite?: boolean;
  images?: Image[];

  // v2 derived fields — provided by parent that aggregates visits.
  visit_count?: number;
  last_visit?: string | null;
  tags?: string[];
  rank?: number; // 1-based; undefined hides the badge
};

function imageUrl(path: string) {
  return `${IMAGE_BASE}/${path}`;
}

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const primary =
    restaurant.images?.find((i) => i.is_primary) ?? restaurant.images?.[0];

  const visitCount = restaurant.visit_count ?? 0;
  const last = restaurant.last_visit ? relativeTime(restaurant.last_visit) : "";
  const tags = restaurant.tags ?? [];

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="relative block rounded-[18px] bg-white p-2.5 flex gap-3 items-center transition-transform active:scale-[0.99]"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
    >
      {restaurant.rank != null && (
        <RankBadge rank={restaurant.rank} />
      )}

      {primary ? (
        <div className="relative w-[72px] h-[72px] rounded-[12px] overflow-hidden shrink-0">
          <Image
            src={imageUrl(primary.storage_path)}
            alt=""
            fill
            sizes="72px"
            className="object-cover"
          />
        </div>
      ) : (() => {
        const s = categoryStyle(restaurant.category);
        return (
          <div
            className="w-[72px] h-[72px] rounded-[12px] shrink-0 flex items-center justify-center text-[34px]"
            style={{ background: s.gradient }}
            aria-hidden="true"
          >
            <span style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.08))" }}>{s.emoji}</span>
          </div>
        );
      })()}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="text-[17px] font-bold tracking-tight truncate">
            {restaurant.name}
          </div>
          {restaurant.is_favorite && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"
              style={{ color: "var(--accent)", flexShrink: 0 }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          <Stars value={restaurant.rating ?? 0} size={12} />
          {restaurant.category && (
            <span className="text-[12px]" style={{ color: "var(--text-2)" }}>
              · {restaurant.category}
            </span>
          )}
        </div>

        {/* Visit info — only when there's at least one visit */}
        {visitCount > 0 && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[11px] font-semibold tabular-nums"
              style={{ background: "var(--bg)", color: "var(--text)" }}
            >
              <Sym name="calendar" size={10} />
              {visitCount}회
            </span>
            {last && (
              <span className="text-[11px] tabular-nums" style={{ color: "var(--text-2)" }}>
                · {last}
              </span>
            )}
            {tags.length > 0 && (
              <span className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
                · {tags.slice(0, 2).map((t) => `#${t}`).join(" ")}
                {tags.length > 2 ? ` +${tags.length - 2}` : ""}
              </span>
            )}
          </div>
        )}

        {/* When no visit yet — fall back to address (preserve v1 behavior) */}
        {visitCount === 0 && restaurant.address && (
          <div
            className="flex items-center gap-1 mt-1 truncate"
            style={{ color: "var(--text-2)" }}
          >
            <Sym name="mappin" size={12} strokeWidth={2} />
            <span className="text-[12px] truncate">{restaurant.address}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
