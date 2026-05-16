import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RestaurantForm from "@/components/restaurants/RestaurantForm";

export default function NewRestaurantPage() {
  async function createRestaurant(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        user_id: user.id,
        name: formData.get("name") as string,
        address: (formData.get("address") as string) || null,
        lat: formData.get("lat") ? parseFloat(formData.get("lat") as string) : null,
        lng: formData.get("lng") ? parseFloat(formData.get("lng") as string) : null,
        category: (formData.get("category") as string) || null,
        rating: formData.get("rating") ? parseInt(formData.get("rating") as string) : null,
        note: (formData.get("note") as string) || null,
      })
      .select()
      .single();

    if (error) throw error;
    redirect(`/restaurants/${data.id}`);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">맛집 추가</h2>
      <RestaurantForm action={createRestaurant} />
    </div>
  );
}
