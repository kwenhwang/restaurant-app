import { NextRequest, NextResponse } from "next/server";

interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  road_address_name: string;
  address_name: string;
  x: string; // lng
  y: string; // lat
  distance: string; // meters as string
}

interface NearbyResult {
  kakaoId: string;
  name: string;
  address: string;
  category: string;       // 우리 카테고리로 매핑된 값
  rawCategory: string;    // kakao 카테고리 (참고용)
  lat: number;
  lng: number;
  distance: number;
}

/**
 * Map Kakao's category to our 8 buckets.
 * Kakao category_name example: "음식점 > 한식 > 곱창,막창" or "음식점 > 카페 > 디저트카페"
 */
function mapCategory(kakaoCategory: string): string {
  const parts = kakaoCategory.split(">").map((s) => s.trim());
  const second = parts[1] ?? "";
  if (second.includes("한식") || second.includes("분식") || second.includes("치킨") || second.includes("족발") || second.includes("국밥")) return "한식";
  if (second.includes("중식")) return "중식";
  if (second.includes("일식") || second.includes("초밥") || second.includes("라멘")) return "일식";
  if (second.includes("양식") || second.includes("이태리") || second.includes("패밀리") || second.includes("피자") || second.includes("햄버거")) return "양식";
  if (second.includes("카페")) {
    if (parts[2]?.includes("디저트") || parts[2]?.includes("베이커리") || parts[2]?.includes("도넛") || parts[2]?.includes("아이스크림")) return "디저트";
    return "카페";
  }
  if (second.includes("제과") || second.includes("베이커리") || second.includes("도넛") || second.includes("아이스크림")) return "디저트";
  if (second.includes("아시아") || second.includes("베트남") || second.includes("태국") || second.includes("인도") || second.includes("멕시코")) return "양식";
  if (second.includes("주점") || second.includes("술집") || second.includes("호프") || second.includes("이자카야") || second.includes("바")) return "술집";
  return "기타";
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const lat = parseFloat(sp.get("lat") ?? "");
  const lng = parseFloat(sp.get("lng") ?? "");
  const radius = Math.min(1000, parseInt(sp.get("radius") ?? "300", 10) || 300);
  if (!isFinite(lat) || !isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }

  // Run two Kakao calls in parallel: FD6=음식점, CE7=카페
  const fetchGroup = (code: string) =>
    fetch(
      `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${code}&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=15`,
      { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` } }
    ).then((r) => r.json());

  const [food, cafe] = await Promise.all([fetchGroup("FD6"), fetchGroup("CE7")]);

  const docs: KakaoPlace[] = [
    ...(food.documents ?? []),
    ...(cafe.documents ?? []),
  ];

  // De-dup by id, sort by distance
  const seen = new Set<string>();
  const results: NearbyResult[] = [];
  for (const d of docs) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    results.push({
      kakaoId: d.id,
      name: d.place_name,
      address: d.road_address_name || d.address_name,
      category: mapCategory(d.category_name),
      rawCategory: d.category_name,
      lat: parseFloat(d.y),
      lng: parseFloat(d.x),
      distance: parseInt(d.distance, 10) || 0,
    });
  }
  results.sort((a, b) => a.distance - b.distance);

  return NextResponse.json({ results: results.slice(0, 20) });
}
