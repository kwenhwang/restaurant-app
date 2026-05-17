"use server";

import { createClient } from "@/lib/supabase/server";

function randomToken(len = 12) {
  const alphabet = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  let s = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) s += alphabet[arr[i] % alphabet.length];
  return s;
}

/**
 * Returns the existing share token for a restaurant, creating one if missing.
 * Only the restaurant owner can call this (enforced by RLS via supabase auth).
 */
export async function ensureShareToken(restaurantId: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existing } = await supabase
    .from("restaurants")
    .select("share_token")
    .eq("id", restaurantId)
    .eq("user_id", user.id)
    .single();

  if (!existing) throw new Error("Restaurant not found");
  if (existing.share_token) return existing.share_token;

  const token = randomToken(12);
  const { error } = await supabase
    .from("restaurants")
    .update({ share_token: token })
    .eq("id", restaurantId)
    .eq("user_id", user.id);
  if (error) throw error;
  return token;
}
