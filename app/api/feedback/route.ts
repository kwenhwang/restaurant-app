// app/api/feedback/route.ts
//
// POST /api/feedback
// Body: { surface, target_ref, vote, prompt_context?, comment? }
//
// vote ∈ { -1, 0, 1 } where 0 means "undo / toggle off" — that path deletes
// the row. Otherwise upserts on (user_id, surface, target_ref). Idempotent.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const VALID_SURFACES = new Set(["recommend", "discover", "review", "menu", "insights"]);
const PROMPT_CONTEXT_MAX_BYTES = 2048;
const COMMENT_MAX = 500;

interface Body {
  surface?: string;
  target_ref?: string;
  vote?: number;
  prompt_context?: unknown;
  comment?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = checkRateLimit({ key: `${user.id}:feedback`, perMinute: 30, perDay: 500 });
  const rlRes = rateLimitResponse(rl);
  if (rlRes) return rlRes;

  const body = (await request.json().catch(() => ({}))) as Body;

  const surface = body.surface;
  const targetRef = body.target_ref;
  const vote = body.vote;
  const comment =
    typeof body.comment === "string" ? body.comment.trim().slice(0, COMMENT_MAX) : null;

  if (!surface || !VALID_SURFACES.has(surface)) {
    return NextResponse.json({ error: "invalid surface" }, { status: 400 });
  }
  if (!targetRef || typeof targetRef !== "string" || targetRef.length > 200) {
    return NextResponse.json({ error: "invalid target_ref" }, { status: 400 });
  }
  if (vote !== -1 && vote !== 0 && vote !== 1) {
    return NextResponse.json({ error: "vote must be -1, 0, or 1" }, { status: 400 });
  }

  // vote === 0 → delete the existing row (toggle-off)
  if (vote === 0) {
    await supabase
      .from("user_feedback")
      .delete()
      .eq("user_id", user.id)
      .eq("surface", surface)
      .eq("target_ref", targetRef);
    return NextResponse.json({ ok: true, vote: 0 });
  }

  // Cap prompt_context. Drop if too large; never persist sources/grounding.
  let promptContext: unknown = body.prompt_context ?? null;
  if (promptContext != null) {
    const serialized = JSON.stringify(promptContext);
    if (serialized.length > PROMPT_CONTEXT_MAX_BYTES) {
      promptContext = { _truncated: true, preview: serialized.slice(0, PROMPT_CONTEXT_MAX_BYTES) };
    }
  }

  const { error } = await supabase.from("user_feedback").upsert(
    {
      user_id: user.id,
      surface,
      target_ref: targetRef,
      vote,
      prompt_context: promptContext,
      comment: comment || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,surface,target_ref" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, vote });
}
