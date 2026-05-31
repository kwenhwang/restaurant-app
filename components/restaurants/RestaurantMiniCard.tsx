// components/restaurants/RestaurantMiniCard.tsx — v3
// Compact card for horizontal section rails (자주 가는 곳 / 즐겨찾기 / 가까운 가게).

import Link from "next/link";
import Image from "next/image";
import Sym from "@/components/ui/Sym";
import CategoryPlaceholder from "@/components/restaurants/CategoryPlaceholder";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

type Img = { id: string; storage_path: string; is_primary?: boolean };
type Restaurant = {
  id: string;
  name: string;
  category?: string | null;
  rating?: number | null;
  images?: Img[];
};

export default function RestaurantMiniCard({
  restaurant,
  sub,
}: {
  restaurant: Restaurant;
  sub?: string;
}) {
  const primary =
    restaurant.images?.find((i) => i.is_primary) ?? restaurant.images?.[0];

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="block shrink-0 transition-transform active:scale-[0.97]"
      style={{ width: 150, scrollSnapAlign: "start" }}
    >
      <div className="relative w-full overflow-hidden" style={{ height: 110, borderRadius: 16, boxShadow: "var(--shadow-1)" }}>
        {primary ? (
          <Image
            src={`${IMAGE_BASE}/${primary.storage_path}`}
            alt={restaurant.name}
            fill
            sizes="150px"
            className="object-cover"
          />
        ) : (
          <CategoryPlaceholder category={restaurant.category} size="thumb" />
        )}
        <div
          className="absolute left-2 bottom-2 inline-flex items-center gap-1 px-2 py-1 rounded-[10px]"
          style={{ background: "rgba(20,16,12,0.55)", backdropFilter: "blur(8px)", color: "#fff" }}
        >
          <Sym name="star.fill" size={11} className="text-accent" />
          <span className="font-extrabold text-[12.5px] tabular-nums">
            {restaurant.rating ? restaurant.rating.toFixed(1) : "—"}
          </span>
        </div>
      </div>
      <div className="pt-2 px-0.5">
        <div className="font-display text-[15.5px] font-extrabold truncate">{restaurant.name}</div>
        {sub && <div className="text-[11.5px] mt-0.5 truncate" style={{ color: "var(--text-2)" }}>{sub}</div>}
      </div>
    </Link>
  );
}
