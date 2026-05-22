import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSONWithImage } from "@/lib/ai/gemini";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

interface MenuItem {
  name: string;
  price: string | null; // e.g., "12,000원" or "₩12,000" or null if not visible
}

interface MenuResult {
  items: MenuItem[];
  price_range: string | null; // e.g., "8,000원~25,000원"
  summary: string;            // 한 문장 메뉴 특징
}

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const _rl = checkRateLimit({ key: `${user.id}:ai`, perMinute: 10, perDay: 100 });
  const _rlRes = rateLimitResponse(_rl);
  if (_rlRes) return _rlRes;
  const { imageId } = await request.json().catch(() => ({}));
  if (!imageId || typeof imageId !== "string") {
    return NextResponse.json({ error: "imageId required" }, { status: 400 });
  }

  const { data: image } = await supabase
    .from("restaurant_images")
    .select("id, storage_path, restaurants!inner(user_id)")
    .eq("id", imageId)
    .single();

  const ownerId = (image as { restaurants?: { user_id: string } } | null)?.restaurants?.user_id;
  if (!image || ownerId !== user.id) {
    return NextResponse.json({ error: "Image not found" }, { status: 403 });
  }

  const imageUrl = `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${image.storage_path}`;
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    return NextResponse.json({ error: "Image fetch failed" }, { status: 502 });
  }

  const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
  const buf = Buffer.from(await imageRes.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }
  const base64 = buf.toString("base64");

  const prompt = `이 사진은 음식점의 메뉴판입니다. 보이는 메뉴와 가격을 한국어로 추출해 주세요.

**출력 규칙:**
- items: 메뉴 항목 배열. 최대 10개까지. 각 항목은 {name, price}.
- 가격이 보이지 않으면 price를 null.
- price는 "12,000원" 또는 "₩12,000" 형식 그대로.
- price_range: 전체 가격대 (최저~최고, 보일 때만)
- summary: 메뉴 특징 한 문장 (50자 내외, "전형적인 한식 가성비 백반집" 같은 톤)
- 메뉴판이 아니면 items=[], summary="메뉴판이 아닌 것 같아요"

**출력 (JSON만, 다른 텍스트 없이):**
{
  "items": [{ "name": "<메뉴명>", "price": "<가격|null>" }],
  "price_range": "<가격대|null>",
  "summary": "<한 문장>"
}`;

  try {
    const result = await generateJSONWithImage<MenuResult>(prompt, base64, contentType, {
      temperature: 0.3,
      maxOutputTokens: 800,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
