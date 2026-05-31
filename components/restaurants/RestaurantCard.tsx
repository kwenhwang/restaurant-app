// components/restaurants/RestaurantCard.tsx — v3
// Photo-forward card (A1): large 4:3 image with score / rank / favorite
// overlays (Beli/Tabelog style). Serif name. Category chip + visit meta below.
// Empty photo → category emoji + gradient (preserved).
// Same `restaurant` prop shape as v2.

import Link from "next/link";
import Image from "next/image";
import Sym from "@/components/ui/Sym";
import Stars from "@/components/ui/Stars";
import FavoriteButton from "@/components/restaurants/FavoriteButton";
import CategoryPlaceholder from "@/components/restaurants/CategoryPlaceholder";
import { categoryStyle } from "@/lib/category-icons";
import { relativeTime } from "@/lib/relative-time";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

type Img = { id: string; storage_path: string; is_primary?: boolean };
type Restaurant = {
  id: string;
  name: string;
  category?: string | null;
  rating?: number | null;
  address?: string | null;
  is_favorite?: boolean;
  images?: Img[];
  visit_count?: number;
  last_visit?: string | null;
  tags?: string[];
  rank?: number;
  rankTotal?: number;
};

function imageUrl(path: string) {
  return `${IMAGE_BASE}/${path}`;
}

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const primary =
    restaurant.images?.find((i) => i.is_primary) ?? restaurant.images?.[0];
  const s = categoryStyle(restaurant.category);
  const visitCount = restaurant.visit_count ?? 0;
  const last = restaurant.last_visit ? relativeTime(restaurant.last_visit) : "";
  const tags = restaurant.tags ?? [];
  const rank = restaurant.rank;
  const gold = rank != null && rank <= 3;

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="block overflow-hidden transition-transform active:scale-[0.98]"
      style={{
        borderRadius: "var(--r-card)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-1)",
      }}
    >
      {/* PHOTO */}
      <div className="relative w-full" style={{ height: 190 }}>
        {primary ? (
          <Image
            src={imageUrl(primary.storage_path)}
            alt={restaurant.name}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover"
          />
        ) : (
          <CategoryPlaceholder category={restaurant.category} size="hero" />
        )}

        {/* top overlays */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {gold ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-extrabold tabular-nums"
              style={{ background: "var(--gold)", color: "#fff" }}
            >
              <Sym name="star.fill" size={10} /> {rank}위
            </span>
          ) : (
            <span />
          )}
          <FavoriteButton
            restaurantId={restaurant.id}
            initial={Boolean(restaurant.is_favorite)}
            size="sm"
            variant="glass"
          />
        </div>

        {/* score */}
        <div
          className="absolute left-3 bottom-3 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[12px]"
          style={{ background: "rgba(20,16,12,0.55)", backdropFilter: "blur(10px)", color: "#fff" }}
        >
          <Sym name="star.fill" size={12} className="text-accent" />
          <span className="font-extrabold text-[14px] tabular-nums">
            {restaurant.rating ? restaurant.rating.toFixed(1) : "—"}
          </span>
        </div>
      </div>

      {/* META */}
      <div className="px-3.5 pt-3 pb-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-[19px] font-extrabold truncate" style={{ letterSpacing: "-0.3px" }}>
            {restaurant.name}
          </h3>
          <Stars value={restaurant.rating ?? 0} size={12} />
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {restaurant.category && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold leading-none"
              style={{ color: `var(--c-${s.key})`, background: `var(--c-${s.key}-soft)` }}
            >
              <span>{s.emoji}</span>
              {restaurant.category}
            </span>
          )}
          {visitCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-2)" }}>
              <span
                className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md font-bold tabular-nums"
                style={{ background: "var(--bg-2)", color: "var(--text)" }}
              >
                <Sym name="calendar" size={10} />
                {visitCount}회
              </span>
              {last && <span className="tabular-nums">{last}</span>}
              {tags.length > 0 && <span style={{ color: "var(--text-3)" }}>#{tags[0]}</span>}
            </span>
          ) : (
            restaurant.address && (
              <span className="inline-flex items-center gap-1 text-[12px] truncate" style={{ color: "var(--text-2)" }}>
                <Sym name="mappin" size={11} strokeWidth={2} />
                {restaurant.address.split(" ").slice(0, 2).join(" ")}
              </span>
            )
          )}
        </div>
      </div>
    </Link>
  );
}
