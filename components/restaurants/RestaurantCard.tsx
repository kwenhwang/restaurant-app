import Link from "next/link";
import Image from "next/image";
import Sym from "@/components/ui/Sym";
import Stars from "@/components/ui/Stars";

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
};

function imageUrl(path: string) {
  return `${IMAGE_BASE}/${path}`;
}

/**
 * Inset-style restaurant card.
 * Thumbnail · Name (+ bookmark) · stars · category · address.
 */
export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const primary =
    restaurant.images?.find((i) => i.is_primary) ?? restaurant.images?.[0];

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="block rounded-[18px] bg-white p-2.5 flex gap-3 items-center transition-transform active:scale-[0.99]"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
    >
      {primary ? (
        <div className="relative w-[72px] h-[72px] rounded-[12px] overflow-hidden shrink-0 bg-stripe">
          <Image
            src={imageUrl(primary.storage_path)}
            alt=""
            fill
            sizes="72px"
            className="object-cover"
          />
        </div>
      ) : (
        <div
          className="w-[72px] h-[72px] rounded-[12px] shrink-0 bg-stripe"
          style={{
            background:
              "linear-gradient(135deg, hsl(22 70% 76%), hsl(46 65% 58%))",
          }}
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="text-[17px] font-bold tracking-tight truncate">
            {restaurant.name}
          </div>
          {restaurant.is_favorite && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--accent)", flexShrink: 0 }}>
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
        {restaurant.address && (
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
