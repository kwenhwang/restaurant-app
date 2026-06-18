"use server";

import { createClient } from "@/lib/supabase/server";
import { deleteImage } from "@/lib/storage";
import { revalidatePath } from "next/cache";

/**
 * Deletes a restaurant the current user owns. Returns ok/error so the
 * client can decide whether to navigate or show the error. Cascade FKs
 * on visits/images/tags/comparisons/scores handle dependent rows.
 *
 * Returns instead of redirecting because redirect() inside a server action
 * awaited from startTransition can be swallowed (same family of issue as
 * the form-action prefix bug, see CollectionForm).
 */
export async function deleteRestaurant(
  restaurantId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  // Collect image paths first so we can clean MinIO after the cascade.
  const { data: imgs } = await supabase
    .from("restaurant_images")
    .select("storage_path")
    .eq("restaurant_id", restaurantId);

  const { error } = await supabase
    .from("restaurants")
    .delete()
    .eq("id", restaurantId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  for (const i of imgs ?? []) {
    await deleteImage(i.storage_path).catch(() => {});
  }

  revalidatePath("/");
  revalidatePath("/visits");
  return { ok: true };
}
