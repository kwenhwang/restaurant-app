"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function applyCategory(restaurantId: string, category: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const valid = ["한식", "중식", "일식", "양식", "카페", "술집", "디저트", "기타"];
  if (!valid.includes(category)) throw new Error("Invalid category");

  const { error } = await supabase
    .from("restaurants")
    .update({ category })
    .eq("id", restaurantId)
    .eq("user_id", user.id);
  if (error) throw error;

  revalidatePath(`/restaurants/${restaurantId}`);
  revalidatePath("/");
}
