import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RestaurantCard from "@/components/restaurants/RestaurantCard";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("*, images:restaurant_images(id, storage_path, is_primary)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          내 맛집 ({restaurants?.length ?? 0})
        </h2>
        <Link
          href="/restaurants/new"
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + 추가
        </Link>
      </div>

      {restaurants && restaurants.length > 0 ? (
        <div className="space-y-3">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-sm">아직 등록된 맛집이 없어요</p>
          <Link
            href="/restaurants/new"
            className="inline-block mt-4 text-orange-500 text-sm font-medium hover:underline"
          >
            첫 번째 맛집 추가하기 →
          </Link>
        </div>
      )}
    </div>
  );
}
