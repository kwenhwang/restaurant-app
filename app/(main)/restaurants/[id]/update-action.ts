"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Update a restaurant row. Takes `restaurantId` as an explicit parameter
 * instead of capturing it via closure (same defensive pattern as
 * deleteRestaurant — Next.js inline-closure server actions can mishandle
 * captured variables in production builds).
 */
export async function updateRestaurant(
  restaurantId: string,
  formData: FormData,
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    .eq("id", restaurantId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/restaurants/${restaurantId}`);
  return { id: restaurantId };
}
