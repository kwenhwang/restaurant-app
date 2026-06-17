"use server";

// Server actions for the pairwise ranking flow.

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { eloUpdate, retierElo, tierInitialElo, type Tier } from "@/lib/pairwise";

interface Opponent {
  id: string;
  name: string;
  category: string | null;
  storage_path: string | null;
  elo: number;
}

async function authedSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, userId: user.id };
}

/**
 * Set / update the tier for a restaurant. If a score row already exists,
 * we re-tier with `retierElo` (preserves prior comparisons) instead of
 * overwriting Elo wholesale.
 */
export async function setInitialTier(
  restaurantId: string,
  tier: Tier,
): Promise<{ ok: true } | { error: string }> {
  const ctx = await authedSupabase();
  if (!ctx) return { error: "Unauthorized" };
  const { supabase, userId } = ctx;

  const { data: existing } = await supabase
    .from("restaurant_scores")
    .select("elo, tier")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", userId)
    .maybeSingle();

  const newElo = existing
    ? retierElo(existing.elo, (existing.tier ?? null) as Tier | null, tier)
    : tierInitialElo(tier);

  const { error } = await supabase
    .from("restaurant_scores")
    .upsert(
      {
        restaurant_id: restaurantId,
        user_id: userId,
        elo: newElo,
        tier,
        updated_at: new Date().toISOString(),
        // comparisons_count NOT touched on re-tier
        ...(existing ? {} : { comparisons_count: 0 }),
      },
      { onConflict: "restaurant_id" },
    );

  if (error) return { error: error.message };

  revalidatePath(`/restaurants/${restaurantId}`);
  return { ok: true };
}

/**
 * Pick opponents for the new restaurant within the same tier. Prefers same
 * category, falls back to all-tier within ±150 Elo. Excludes the restaurant
 * itself.
 */
export async function pickOpponents(
  restaurantId: string,
  count = 3,
): Promise<Opponent[]> {
  const ctx = await authedSupabase();
  if (!ctx) return [];
  const { supabase, userId } = ctx;

  // Subject row + tier + category
  const { data: subject } = await supabase
    .from("restaurants")
    .select("id, category, restaurant_scores(tier, elo)")
    .eq("id", restaurantId)
    .eq("user_id", userId)
    .single();

  if (!subject) return [];

  // Type narrowing — supabase returns the related row as an object/array
  const scoreData = Array.isArray(
    (subject as unknown as { restaurant_scores: unknown }).restaurant_scores,
  )
    ? (subject as unknown as { restaurant_scores: { tier: number | null; elo: number }[] })
        .restaurant_scores[0]
    : (
        (subject as unknown as { restaurant_scores: { tier: number | null; elo: number } })
          .restaurant_scores
      );
  const tier = scoreData?.tier ?? null;
  const subjectElo = scoreData?.elo ?? 1000;

  // Candidates in the user's universe, with primary image + score
  let q = supabase
    .from("restaurants")
    .select(
      "id, name, category, restaurant_images(storage_path, is_primary), restaurant_scores(elo, tier)",
    )
    .eq("user_id", userId)
    .neq("id", restaurantId);

  if (tier !== null) {
    q = q.eq("restaurant_scores.tier", tier);
  }

  const { data: rows } = await q;
  if (!rows) return [];

  type Row = {
    id: string;
    name: string;
    category: string | null;
    restaurant_images: { storage_path: string; is_primary: boolean | null }[] | null;
    restaurant_scores:
      | { elo: number; tier: number | null }[]
      | { elo: number; tier: number | null }
      | null;
  };

  const enriched = (rows as Row[]).flatMap((row) => {
    const score = Array.isArray(row.restaurant_scores)
      ? row.restaurant_scores[0]
      : row.restaurant_scores;
    if (!score) return [];
    // When tier filter applied, supabase may include rows whose join row is null;
    // we keep only those with a matching score row (already enforced above).
    const primary =
      row.restaurant_images?.find((i) => i.is_primary)?.storage_path ??
      row.restaurant_images?.[0]?.storage_path ??
      null;
    return [
      {
        id: row.id,
        name: row.name,
        category: row.category,
        storage_path: primary,
        elo: score.elo,
      } as Opponent,
    ];
  });

  // Score candidates: same category +1, distance penalty
  const scored = enriched.map((opp) => {
    const sameCat = opp.category === subject.category ? 1 : 0;
    const distance = Math.abs(opp.elo - subjectElo);
    return { opp, key: sameCat * 200 - distance };
  });
  scored.sort((a, b) => b.key - a.key);

  return scored.slice(0, count).map((s) => s.opp);
}

/**
 * Record a comparison. Atomic-ish two-row update via single batched RPC
 * isn't worth the complexity here; we read-then-write but only via the
 * authed session, so RLS prevents cross-user damage even on races.
 */
export async function recordComparison(
  winnerId: string,
  loserId: string,
  context: "capture" | "rerank" | "onboarding" = "capture",
): Promise<{ ok: true } | { error: string }> {
  if (winnerId === loserId) return { error: "winner == loser" };
  const ctx = await authedSupabase();
  if (!ctx) return { error: "Unauthorized" };
  const { supabase, userId } = ctx;

  // Read current Elo for both (must both belong to user)
  const { data: rows } = await supabase
    .from("restaurant_scores")
    .select("restaurant_id, elo, comparisons_count, tier")
    .eq("user_id", userId)
    .in("restaurant_id", [winnerId, loserId]);

  if (!rows || rows.length !== 2) {
    return { error: "Score rows not found" };
  }
  const w = rows.find((r) => r.restaurant_id === winnerId)!;
  const l = rows.find((r) => r.restaurant_id === loserId)!;

  const { winner: newWinnerElo, loser: newLoserElo } = eloUpdate({
    winnerElo: w.elo,
    loserElo: l.elo,
    winnerComparisons: w.comparisons_count ?? 0,
  });

  // Get winner's category for denorm on the comparison row
  const { data: winnerRow } = await supabase
    .from("restaurants")
    .select("category")
    .eq("id", winnerId)
    .eq("user_id", userId)
    .single();

  // Persist — three writes, can't be wrapped in a tx without RPC.
  // Worst-case race results in slight off-by-one Elo drift, not data corruption.
  const now = new Date().toISOString();
  const [{ error: e1 }, { error: e2 }, { error: e3 }] = await Promise.all([
    supabase
      .from("restaurant_scores")
      .update({
        elo: newWinnerElo,
        comparisons_count: (w.comparisons_count ?? 0) + 1,
        updated_at: now,
      })
      .eq("restaurant_id", winnerId)
      .eq("user_id", userId),
    supabase
      .from("restaurant_scores")
      .update({
        elo: newLoserElo,
        comparisons_count: (l.comparisons_count ?? 0) + 1,
        updated_at: now,
      })
      .eq("restaurant_id", loserId)
      .eq("user_id", userId),
    supabase.from("restaurant_comparisons").insert({
      user_id: userId,
      winner_id: winnerId,
      loser_id: loserId,
      context,
      category: winnerRow?.category ?? null,
    }),
  ]);

  if (e1 || e2 || e3) {
    return { error: (e1 || e2 || e3)!.message };
  }

  revalidatePath(`/restaurants/${winnerId}`);
  revalidatePath(`/restaurants/${loserId}`);
  revalidatePath("/");
  return { ok: true };
}
