// POST /api/follow  { followee_id, on: boolean }
// Idempotent: on=true upserts the follow edge, on=false deletes it.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const followee = String(body.followee_id ?? "");
  const on = Boolean(body.on);

  if (!followee || followee === user.id) {
    return NextResponse.json({ error: "invalid followee" }, { status: 400 });
  }

  if (on) {
    const { error } = await supabase
      .from("user_follows")
      .upsert(
        { follower_id: user.id, followee_id: followee },
        { onConflict: "follower_id,followee_id", ignoreDuplicates: true },
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followee_id", followee);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, on });
}
