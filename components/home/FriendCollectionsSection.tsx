// Server component: pulls the public collections owned by people the
// current user follows, ordered by most recent. Renders FriendCollections
// for the actual UI.

import { createClient } from "@/lib/supabase/server";
import FriendCollections from "./FriendCollections";

interface Props {
  userId: string;
}

export default async function FriendCollectionsSection({ userId }: Props) {
  const supabase = await createClient();

  const { data: edges } = await supabase
    .from("user_follows")
    .select("followee_id")
    .eq("follower_id", userId);

  const followees = (edges ?? []).map((e) => e.followee_id as string);
  if (followees.length === 0) return null;

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, description, cover_image, item_count, share_token, updated_at, owner_id")
    .in("owner_id", followees)
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (!collections || collections.length === 0) return null;

  return <FriendCollections items={collections} />;
}
