import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import RestaurantForm from "@/components/restaurants/RestaurantForm";

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!restaurant) notFound();

  async function updateRestaurant(
    formData: FormData,
  ): Promise<{ id: string } | { error: string }> {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "로그인이 필요해요" };

    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "이름이 필요해요" };

    const { error } = await supabase
      .from("restaurants")
      .update({
        name,
        address: (formData.get("address") as string) || null,
        lat: formData.get("lat") ? parseFloat(formData.get("lat") as string) : null,
        lng: formData.get("lng") ? parseFloat(formData.get("lng") as string) : null,
        category: (formData.get("category") as string) || null,
        rating: formData.get("rating") ? parseInt(formData.get("rating") as string) : null,
        note: (formData.get("note") as string) || null,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath(`/restaurants/${id}`);
    return { id };
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">맛집 수정</h2>
      <RestaurantForm action={updateRestaurant} restaurant={restaurant} />
    </div>
  );
}
