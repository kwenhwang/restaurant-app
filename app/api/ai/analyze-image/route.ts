import { NextResponse } from "next/server";
import { generateJSONWithImage } from "@/lib/ai/gemini";
import { AIBadRequest, createAIRoute } from "@/lib/ai/handler";

interface AnalysisResult {
  category: string;
  confidence: "high" | "medium" | "low";
  description: string;
  detected_items: string[];
}

const MAX_BYTES = 4 * 1024 * 1024;
const VALID_CATEGORIES = ["한식", "중식", "일식", "양식", "카페", "술집", "디저트", "기타"];

export const dynamic = "force-dynamic";

export const POST = createAIRoute<{ imageId: string }, AnalysisResult>({
  rateKey: "ai-analyze-image",
  perMinute: 10,
  perDay: 100,
  parseBody: (raw) => {
    const obj = raw as { imageId?: unknown };
    if (typeof obj.imageId !== "string" || !obj.imageId) {
      throw new AIBadRequest("imageId required");
    }
    return { imageId: obj.imageId };
  },
  handler: async ({ supabase, user, body }) => {
    // Verify ownership via join + fetch storage path
    const { data: image } = await supabase
      .from("restaurant_images")
      .select("id, storage_path, restaurants!inner(user_id)")
      .eq("id", body.imageId)
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
      return NextResponse.json({ error: "Image too large for analysis" }, { status: 413 });
    }
    const base64 = buf.toString("base64");

    const prompt = `이 사진은 한 음식점의 사진입니다. 메뉴 사진, 매장 외관, 메뉴판, 음료 등 어떤 종류든 분석해서 음식점 카테고리를 추정해 주세요.

**가능한 카테고리 (반드시 이 중 하나):**
- 한식: 한국 음식 (찌개, 김치, 비빔밥, 분식, 치킨, 삼겹살 등)
- 중식: 중국 음식 (짜장면, 짬뽕, 마라탕 등)
- 일식: 일본 음식 (초밥, 라멘, 돈카츠, 우동 등)
- 양식: 서양 음식 (파스타, 피자, 스테이크, 햄버거 등)
- 카페: 커피·디저트·브런치 위주 (디저트만 있어도 OK)
- 술집: 술 + 안주 (이자카야, 호프, 와인바 등)
- 디저트: 베이커리·아이스크림·디저트 전문
- 기타: 위 분류에 속하지 않음

**출력 (JSON만, 다른 텍스트 없이):**
{
  "category": "<카테고리 한 단어>",
  "confidence": "high" | "medium" | "low",
  "description": "<한 문장 한국어 설명, 30자 내외>",
  "detected_items": ["<식별된 음식/물품 이름 1~3개, 한국어>"]
}

사진이 음식과 무관하면 confidence를 "low"로 하고 category를 "기타"로.`;

    const result = await generateJSONWithImage<AnalysisResult>(prompt, base64, contentType, {
      temperature: 0.3,
      maxOutputTokens: 400,
    });

    if (!VALID_CATEGORIES.includes(result.category)) result.category = "기타";
    return result;
  },
});
