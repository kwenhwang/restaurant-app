import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSONWithImage } from "@/lib/ai/gemini";

interface AnalysisResult {
  category: string;
  confidence: "high" | "medium" | "low";
  description: string;
  detected_items: string[];
}

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "image only" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too large" }, { status: 413 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const prompt = `이 사진은 한 음식점의 사진입니다. 메뉴 사진, 매장 외관, 메뉴판, 음료 등 어떤 종류든 분석해서 음식점 카테고리를 추정해 주세요.

**가능한 카테고리 (반드시 이 중 하나):** 한식·중식·일식·양식·카페·술집·디저트·기타

**출력 (JSON만):**
{
  "category": "<카테고리 한 단어>",
  "confidence": "high" | "medium" | "low",
  "description": "<한 문장 한국어, 30자 내외>",
  "detected_items": ["<식별된 음식/물품 1~3개, 한국어>"]
}

사진이 음식과 무관하면 confidence="low", category="기타".`;

  try {
    const result = await generateJSONWithImage<AnalysisResult>(
      prompt,
      base64,
      file.type || "image/jpeg",
      { temperature: 0.3, maxOutputTokens: 400 }
    );
    const valid = ["한식", "중식", "일식", "양식", "카페", "술집", "디저트", "기타"];
    if (!valid.includes(result.category)) result.category = "기타";
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
