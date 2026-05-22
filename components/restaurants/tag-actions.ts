// components/restaurants/tag-actions.ts
// Server actions to add/remove tags. Used by TagPicker.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_TAGS = 6;
const MAX_TAG_LEN = 24;

function normalize(tag: string): string {
  // Strip leading #, collapse spaces, trim. Keep Korean as-is.
  return tag.replace(/^#/, "").trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LEN);
}

export async function setTags(restaurantId: string, tags: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  // Verify ownership before doing anything else (RLS will block too, but
  // failing fast gives clearer errors)
  const { data: r } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("user_id", user.id)
    .single();
  if (!r) throw new Error("not_found");

  const cleaned = Array.from(
    new Set(tags.map(normalize).filter(Boolean))
  ).slice(0, MAX_TAGS);

  // Replace tags atomically: delete all + insert new set.
  await supabase
    .from("restaurant_tags")
    .delete()
    .eq("restaurant_id", restaurantId);

  if (cleaned.length > 0) {
    await supabase
      .from("restaurant_tags")
      .insert(cleaned.map((tag) => ({ restaurant_id: restaurantId, tag })));
  }

  revalidatePath(`/restaurants/${restaurantId}`);
  revalidatePath("/");
}
