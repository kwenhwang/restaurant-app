import { generateJSON } from "@/lib/ai/gemini";
import { AIBadRequest, createAIRoute } from "@/lib/ai/handler";

interface ParseResult {
  name: string | null;
  address: string | null;
  category: string | null;
}

const VALID_CATEGORIES = ["한식", "중식", "일식", "양식", "카페", "술집", "디저트", "기타"];

export const dynamic = "force-dynamic";

export const POST = createAIRoute<{ text: string }, ParseResult>({
  rateKey: "ai-parse-share",
  perMinute: 10,
  perDay: 100,
  parseBody: (raw) => {
    const obj = raw as { text?: unknown };
    if (typeof obj.text !== "string" || !obj.text.trim()) {
      throw new AIBadRequest("text required");
    }
    return { text: obj.text };
  },
  handler: async ({ body }) => {
    const trimmed = body.text.trim().slice(0, 1500);
    const prompt = `다음은 다른 앱(카카오맵, 네이버, 인스타, 블로그 등)에서 공유한 텍스트야.
여기서 음식점 정보를 추출해.

**공유된 내용:**
"""
${trimmed.replace(/"""/g, '"\\"\\"')}
"""

**추출 규칙:**
- name: 식당 상호명만. URL은 이름이 아님. 분명히 보이면, 아니면 null
- address: 도로명/지번 주소. 부분 주소도 OK (예: "서울 강남구 ..."). 안 보이면 null
- category: 한식·중식·일식·양식·카페·술집·디저트·기타 중 하나, 추론. 모르겠으면 null

**출력 (JSON만):**
{
  "name": <문자열|null>,
  "address": <문자열|null>,
  "category": <문자열|null>
}`;

    const result = await generateJSON<ParseResult>(prompt, {
      temperature: 0.2,
      maxOutputTokens: 300,
    });
    if (result.category && !VALID_CATEGORIES.includes(result.category)) result.category = null;
    return result;
  },
});
