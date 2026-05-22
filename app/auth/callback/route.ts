import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback. Supabase/GoTrue redirects here with `?code=...` after the
 * user authenticates with the external provider (Google). We exchange the
 * code for a session and set cookies, then send the user home.
 *
 * Errors fall back to /login?error=... so the user sees feedback.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");

  // Determine canonical site origin from (in order):
  // 1. NEXT_PUBLIC_SITE_URL env (most reliable in self-hosted prod)
  // 2. X-Forwarded-Host header (from nginx)
  // 3. Host header
  const envSite = process.env.NEXT_PUBLIC_SITE_URL;
  const fwdHost = request.headers.get("x-forwarded-host");
  const fwdProto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("host");
  const origin =
    envSite ||
    (fwdHost ? `${fwdProto}://${fwdHost}` : host ? `${fwdProto}://${host}` : request.nextUrl.origin);

  if (error) {
    const description = searchParams.get("error_description") ?? error;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(description)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
