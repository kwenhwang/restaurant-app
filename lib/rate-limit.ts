/**
 * Lightweight in-memory rate limiter.
 * Single-instance app (systemd Next.js process) so memory is fine.
 * Restart resets counters — that's acceptable (more permissive, not less).
 *
 * Two-tier limit: per-minute (burst) + per-day (sustained).
 */

interface Bucket {
  minute: { count: number; resetAt: number };
  day: { count: number; resetAt: number };
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so memory doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [key, b] of buckets) {
    if (b.minute.resetAt < now && b.day.resetAt < now) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

export interface RateLimitResult {
  ok: boolean;
  reason?: "minute" | "day";
  retryAfter?: number; // seconds
}

export function checkRateLimit(opts: {
  key: string; // typically `${userId}:${scope}`
  perMinute: number;
  perDay: number;
}): RateLimitResult {
  const now = Date.now();
  let b = buckets.get(opts.key);

  if (!b) {
    b = {
      minute: { count: 0, resetAt: now + 60_000 },
      day: { count: 0, resetAt: now + 24 * 60 * 60_000 },
    };
    buckets.set(opts.key, b);
  }

  if (b.minute.resetAt < now) {
    b.minute = { count: 0, resetAt: now + 60_000 };
  }
  if (b.day.resetAt < now) {
    b.day = { count: 0, resetAt: now + 24 * 60 * 60_000 };
  }

  if (b.minute.count >= opts.perMinute) {
    return {
      ok: false,
      reason: "minute",
      retryAfter: Math.ceil((b.minute.resetAt - now) / 1000),
    };
  }
  if (b.day.count >= opts.perDay) {
    return {
      ok: false,
      reason: "day",
      retryAfter: Math.ceil((b.day.resetAt - now) / 1000),
    };
  }

  b.minute.count++;
  b.day.count++;
  return { ok: true };
}

/**
 * Wrap a Next.js API handler with rate limiting.
 * Returns 429 JSON if exceeded.
 */
import { NextResponse } from "next/server";

export function rateLimitResponse(result: RateLimitResult): NextResponse | null {
  if (result.ok) return null;
  const msg =
    result.reason === "minute"
      ? `너무 빨라요. ${result.retryAfter}초 후 다시 시도해 주세요.`
      : `오늘 한도(AI 호출)를 초과했어요. 내일 다시 시도해 주세요.`;
  return NextResponse.json(
    { error: msg, code: "RATE_LIMITED", retryAfter: result.retryAfter },
    {
      status: 429,
      headers: result.retryAfter
        ? { "Retry-After": String(result.retryAfter) }
        : undefined,
    }
  );
}
