import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PairwiseFlow from "@/components/ranking/PairwiseFlow";
import type { Tier } from "@/lib/pairwise";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export const dynamic = "force-dynamic";

export default async function RankPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const mode = sp.mode === "rerank" ? "rerank" : "capture";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, category, restaurant_images(storage_path, is_primary, blur_data_url)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!restaurant) notFound();

  // Existing tier (for re-rank flow we already have one; capture mode usually doesn't)
  const { data: scoreRow } = await supabase
    .from("restaurant_scores")
    .select("tier")
    .eq("restaurant_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  type Img = { storage_path: string; is_primary: boolean | null; blur_data_url: string | null };
  const imgs = (restaurant as { restaurant_images?: Img[] }).restaurant_images ?? [];
  const primary = imgs.find((i) => i.is_primary) ?? imgs[0];

  return (
    <PairwiseFlow
      subject={{
        id: restaurant.id,
        name: restaurant.name,
        category: restaurant.category ?? null,
        storage_path: primary?.storage_path ?? null,
        blur_data_url: primary?.blur_data_url ?? null,
      }}
      mode={mode}
      initialTier={(scoreRow?.tier ?? null) as Tier | null}
    />
  );
}
