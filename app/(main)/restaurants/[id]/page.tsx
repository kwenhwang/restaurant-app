import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import DeleteButton from "@/components/restaurants/DeleteButton";
import ImageUpload from "@/components/restaurants/ImageUpload";
import AddVisit from "@/components/visits/AddVisit";
import VisitList from "@/components/visits/VisitList";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const STARS = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*, images:restaurant_images(*)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!restaurant) notFound();

  const { data: visits } = await supabase
    .from("visits")
    .select("*")
    .eq("restaurant_id", id)
    .order("visited_at", { ascending: false });

  async function deleteRestaurant() {
    "use server";
    const supabase = await createClient();
    await supabase.from("restaurants").delete().eq("id", id);
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 목록</Link>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{restaurant.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {restaurant.category && (
                <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                  {restaurant.category}
                </span>
              )}
              {restaurant.rating && (
                <span className="text-orange-400 text-sm">{STARS[restaurant.rating]}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/restaurants/${id}/edit`}
              className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 border rounded-lg"
            >
              수정
            </Link>
            <DeleteButton action={deleteRestaurant} />
          </div>
        </div>

        {restaurant.address && (
          <p className="text-sm text-gray-500 mb-3">📍 {restaurant.address}</p>
        )}

        {restaurant.note && (
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{restaurant.note}</p>
        )}
      </div>

      <ImageUpload restaurantId={id} images={restaurant.images ?? []} />

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-900 mb-4">방문 기록</h3>
        <AddVisit restaurantId={id} />
        <VisitList visits={visits ?? []} />
      </div>
    </div>
  );
}
