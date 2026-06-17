import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = checkRateLimit({ key: `${user.id}:kakao-address`, perMinute: 30, perDay: 1000 });
  const rlRes = rateLimitResponse(rl);
  if (rlRes) return rlRes;

  const query = request.nextUrl.searchParams.get("query");
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
    { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` } }
  );

  const data = await res.json();
  const doc = data.documents?.[0];
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ lat: doc.y, lng: doc.x, address: doc.address_name });
}
