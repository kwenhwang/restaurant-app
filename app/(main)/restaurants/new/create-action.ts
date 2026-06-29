"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Create a restaurant row. Lives in a dedicated module file (not an inline
 * closure inside page.tsx) — Next.js inline-closure server actions can
 * mishandle captured/serialized state in production builds (CLAUDE.md §3.1,
 * commits e4eb2e7 / 0878af4). Mirrors updateRestaurant in [id]/update-action.ts.
 */
export async function createRestaurant(
  formData: FormData,
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "이름이 필요해요" };

  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      user_id: user.id,
      name,
      address: (formData.get("address") as string) || null,
      lat: formData.get("lat") ? parseFloat(formData.get("lat") as string) : null,
      lng: formData.get("lng") ? parseFloat(formData.get("lng") as string) : null,
      category: (formData.get("category") as string) || null,
      note: (formData.get("note") as string) || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "저장 실패" };
  return { id: data.id };
}
