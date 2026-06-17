// AI route helper. Collapses the 30-line auth + rate-limit + JSON-parse +
// quota-error boilerplate that the 9 /api/ai/* routes had in common.
//
// Handler return values:
//   - Plain object → wrapped in NextResponse.json(...)
//   - NextResponse → returned as-is (for custom error responses that need
//     to do side effects like cache writes before responding)
//   - Throw → caught, mapped to quota or generic AI error response

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface AIRouteContext<TBody> {
  supabase: SupabaseClient;
  user: User;
  request: NextRequest;
  body: TBody;
}

export interface AIRouteOpts<TBody, TResult> {
  rateKey: string;
  perMinute?: number;
  perDay?: number;
  /**
   * Optional body parser for POST routes. If omitted, body is `null`.
   * Throw to short-circuit with a 400.
   */
  parseBody?: (raw: unknown) => TBody;
  handler: (ctx: AIRouteContext<TBody>) => Promise<TResult | NextResponse>;
}

export class AIBadRequest extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIBadRequest";
  }
}

function isResponse(v: unknown): v is NextResponse {
  return typeof v === "object" && v !== null && "body" in v && "headers" in v && "status" in v;
}

export function createAIRoute<TBody, TResult>(
  opts: AIRouteOpts<TBody, TResult>,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit({
      key: `${user.id}:${opts.rateKey}`,
      perMinute: opts.perMinute ?? 10,
      perDay: opts.perDay ?? 100,
    });
    const rlRes = rateLimitResponse(rl);
    if (rlRes) return rlRes;

    let body: TBody;
    if (opts.parseBody) {
      const raw = await request.json().catch(() => ({}));
      try {
        body = opts.parseBody(raw);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "bad request";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    } else {
      body = null as unknown as TBody;
    }

    try {
      const result = await opts.handler({ supabase, user, request, body });
      if (isResponse(result)) return result;
      return NextResponse.json(result);
    } catch (e) {
      if (e instanceof AIBadRequest) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      const raw = e instanceof Error ? e.message : "AI error";
      const isQuota = /429|quota|rate.?limit/i.test(raw);
      return NextResponse.json(
        {
          error: isQuota
            ? "AI 사용량이 한도에 닿았어요. 잠시 후 다시 시도해 주세요."
            : "처리에 실패했어요. 잠시 후 다시 시도해 주세요.",
          code: isQuota ? "QUOTA_EXCEEDED" : "AI_ERROR",
        },
        { status: isQuota ? 429 : 502 },
      );
    }
  };
}
