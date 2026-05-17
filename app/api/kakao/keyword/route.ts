import { NextRequest, NextResponse } from "next/server";

interface KakaoDoc {
  place_name: string;
  address_name: string;
  road_address_name: string;
  category_name: string;
  x: string;
  y: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=10`,
    { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` } }
  );

  const data = await res.json();
  const results = (data.documents ?? []).map((d: KakaoDoc) => ({
    name: d.place_name,
    address: d.road_address_name || d.address_name,
    category: d.category_name,
    lat: parseFloat(d.y),
    lng: parseFloat(d.x),
  }));

  return NextResponse.json({ results });
}
