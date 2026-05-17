"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface MenuItem {
  name: string;
  price: string | null;
}

export interface MenuData {
  items: MenuItem[];
  price_range: string | null;
  summary: string | null;
  source: "ai-vision" | "manual";
}

export async function saveMenu(restaurantId: string, menu: MenuData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Light validation
  const cleaned: MenuData = {
    items: (menu.items ?? []).slice(0, 20).map((i) => ({
      name: String(i.name ?? "").slice(0, 80),
      price: i.price ? String(i.price).slice(0, 30) : null,
    })),
    price_range: menu.price_range?.slice(0, 50) ?? null,
    summary: menu.summary?.slice(0, 200) ?? null,
    source: menu.source ?? "ai-vision",
  };

  const { error } = await supabase
    .from("restaurants")
    .update({ menu: cleaned })
    .eq("id", restaurantId)
    .eq("user_id", user.id);
  if (error) throw error;

  revalidatePath(`/restaurants/${restaurantId}`);
}

export async function clearMenu(restaurantId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("restaurants")
    .update({ menu: null })
    .eq("id", restaurantId)
    .eq("user_id", user.id);
  if (error) throw error;

  revalidatePath(`/restaurants/${restaurantId}`);
}
