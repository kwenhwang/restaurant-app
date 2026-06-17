// Premium subscription helpers.
//
// Authoritative source: `public.subscriptions` table. A user is "premium"
// when they have ONE row with status in ('trialing', 'active', 'past_due')
// whose `current_period_end` (or `trial_end_at` for trialing) is in the
// future.
//
// We expose three helpers:
//   getPremiumStatus(supabase, userId)  → { tier, until } | null
//   isPremium(supabase, userId)          → boolean (convenience)
//   requirePremiumOrThrow(supabase, userId) → throws if not premium
//
// Read-only operations — never grants premium. Granting happens in
// /api/billing/* routes via the service-role admin client.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface PremiumStatus {
  tier: "premium";
  status: "trialing" | "active" | "past_due";
  plan: "premium-monthly" | "premium-yearly";
  /** When the current period ends (or trial ends if trialing). */
  until: string;
}

export async function getPremiumStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<PremiumStatus | null> {
  const { data } = await supabase
    .from("current_subscription")
    .select("status, plan, current_period_end, trial_end_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;

  const status = data.status as "trialing" | "active" | "past_due";
  const until =
    status === "trialing"
      ? (data.trial_end_at as string | null)
      : (data.current_period_end as string | null);

  // No expiry timestamp at all → treat as inactive
  if (!until) return null;
  if (new Date(until).getTime() < Date.now()) return null;

  return {
    tier: "premium",
    status,
    plan: (data.plan ?? "premium-monthly") as PremiumStatus["plan"],
    until,
  };
}

export async function isPremium(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  return (await getPremiumStatus(supabase, userId)) != null;
}

export class PremiumRequiredError extends Error {
  constructor() {
    super("Premium subscription required");
    this.name = "PremiumRequiredError";
  }
}

export async function requirePremiumOrThrow(
  supabase: SupabaseClient,
  userId: string,
): Promise<PremiumStatus> {
  const status = await getPremiumStatus(supabase, userId);
  if (!status) throw new PremiumRequiredError();
  return status;
}
