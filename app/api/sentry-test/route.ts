import { NextResponse } from "next/server";

// Temporary endpoint to verify Sentry server-side capture.
// Remove after first launch verification.
export async function GET() {
  throw new Error("Sentry test — server-side error from /api/sentry-test");
  return NextResponse.json({ ok: true });
}
