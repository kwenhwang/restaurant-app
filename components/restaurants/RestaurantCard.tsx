import Link from "next/link";
import Image from "next/image";
import { Restaurant } from "@/lib/types";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

const STARS = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const primaryImage = restaurant.images?.find((i) => i.is_primary) ?? restaurant.images?.[0];
  const imageUrl = primaryImage
    ? `${IMAGE_BASE}/${primaryImage.storage_path}`
    : null;

  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <div className="bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all flex gap-3 p-3">
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={restaurant.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{restaurant.name}</h3>
            {restaurant.rating && (
              <span className="text-orange-400 text-xs flex-shrink-0">
                {STARS[restaurant.rating]}
              </span>
            )}
          </div>
          {restaurant.category && (
            <span className="inline-block text-xs text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 mt-1">
              {restaurant.category}
            </span>
          )}
          {restaurant.address && (
            <p className="text-xs text-gray-400 mt-1 truncate">{restaurant.address}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
