"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveNote(
  restaurantId: string,
  note: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const trimmed = note.trim().slice(0, 2000);

  const { error } = await supabase
    .from("restaurants")
    .update({ note: trimmed || null })
    .eq("id", restaurantId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/restaurants/${restaurantId}`);
  return { ok: true };
}
