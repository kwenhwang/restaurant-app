"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

function newToken() {
  // 16 bytes = 128 bits of entropy → ~22 char base64url. Cryptographically
  // unguessable. Previously 8 bytes (64 bits) was technically brute-forceable
  // by a dedicated attacker; not exploitable at our traffic level but no
  // reason to leave it weak.
  return randomBytes(16).toString("base64url");
}

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createCollection(
  formData: FormData,
): Promise<{ id: string } | { error: string }> {
  const { supabase, user } = await authed();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const isPublic = formData.get("is_public") === "on";

  if (!name) return { error: "이름이 필요해요" };

  const { data, error } = await supabase
    .from("collections")
    .insert({
      owner_id: user.id,
      name: name.slice(0, 60),
      description: description?.slice(0, 280) ?? null,
      is_public: isPublic,
      share_token: isPublic ? newToken() : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "생성에 실패했어요" };
  }

  revalidatePath("/collections");
  return { id: data.id };
}

export async function deleteCollection(id: string): Promise<void> {
  const { supabase, user } = await authed();
  await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);
  revalidatePath("/collections");
}

export async function updateCollection(
  formData: FormData,
): Promise<{ id: string } | { error: string }> {
  const { supabase, user } = await authed();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const isPublic = formData.get("is_public") === "on";

  if (!id || !name) return { error: "id와 이름이 필요해요" };

  const existing = await supabase
    .from("collections")
    .select("share_token, is_public")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  const shareToken = isPublic
    ? existing.data?.share_token ?? newToken()
    : null;

  const { error } = await supabase
    .from("collections")
    .update({
      name: name.slice(0, 60),
      description: description?.slice(0, 280) ?? null,
      is_public: isPublic,
      share_token: shareToken,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/collections/${id}`);
  revalidatePath("/collections");
  return { id };
}

export async function addToCollection(
  collectionId: string,
  restaurantId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await authed();

  // Verify the user owns the collection
  const { data: col } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("owner_id", user.id)
    .single();
  if (!col) return { ok: false, error: "Not found" };

  // Verify the restaurant belongs to the user
  const { data: rest } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("user_id", user.id)
    .single();
  if (!rest) return { ok: false, error: "Restaurant not found" };

  const { error } = await supabase.from("collection_items").upsert(
    {
      collection_id: collectionId,
      restaurant_id: restaurantId,
      added_by: user.id,
    },
    { onConflict: "collection_id,restaurant_id", ignoreDuplicates: true },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/collections/${collectionId}`);
  revalidatePath(`/restaurants/${restaurantId}`);
  return { ok: true };
}

export async function removeFromCollection(
  collectionId: string,
  restaurantId: string,
): Promise<void> {
  const { supabase, user } = await authed();
  // RLS check: only owner can delete (policy enforces this via collection check)
  await supabase
    .from("collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("restaurant_id", restaurantId);

  // Belt-and-suspenders: confirm user owns the collection
  const { data: col } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("owner_id", user.id)
    .single();
  if (!col) return;

  revalidatePath(`/collections/${collectionId}`);
}

/**
 * Import a public collection's items into a new collection owned by the
 * current user. The new collection contains the SAME restaurants only if
 * the user already owns them (we don't copy other users' rows).
 *
 * Practical limit: this is most useful when the source uses public/shared
 * cache data (place names + locations) rather than personal data.
 *
 * For v1 we simply create an empty new collection with the imported name —
 * the social-import flow can grow later.
 */
export async function cloneCollectionShell(sourceId: string): Promise<void> {
  const { supabase, user } = await authed();
  const { data: src } = await supabase
    .from("collections")
    .select("name, description")
    .eq("id", sourceId)
    .eq("is_public", true)
    .single();

  if (!src) return;

  const { data: created } = await supabase
    .from("collections")
    .insert({
      owner_id: user.id,
      name: `${src.name} (가져옴)`.slice(0, 60),
      description: src.description,
      is_public: false,
    })
    .select("id")
    .single();

  if (created) {
    revalidatePath("/collections");
    redirect(`/collections/${created.id}`);
  }
}
