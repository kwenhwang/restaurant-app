"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Edit the memo on an existing visit row. Restaurant id is needed only for
 * cache revalidation; ownership is enforced via visits.user_id eq auth.uid()
 * (RLS will also enforce, but explicit defense in depth).
 */
export async function updateVisitMemo(
  visitId: string,
  restaurantId: string,
  memo: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const trimmed = memo.trim().slice(0, 1000);

  const { error } = await supabase
    .from("visits")
    .update({ memo: trimmed || null })
    .eq("id", visitId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/restaurants/${restaurantId}`);
  revalidatePath("/visits");
  return { ok: true };
}

export async function deleteVisit(
  visitId: string,
  restaurantId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const { error } = await supabase
    .from("visits")
    .delete()
    .eq("id", visitId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/restaurants/${restaurantId}`);
  revalidatePath("/visits");
  return { ok: true };
}
