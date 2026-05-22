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
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");

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
