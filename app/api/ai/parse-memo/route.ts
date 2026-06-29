import { generateJSON } from "@/lib/ai/gemini";
import { AIBadRequest, createAIRoute } from "@/lib/ai/handler";

interface ParseResult {
  name: string | null;
  category: string | null;
  memo: string | null;
}

const VALID_CATEGORIES = ["한식", "중식", "일식", "양식", "카페", "술집", "디저트", "기타"];

export const dynamic = "force-dynamic";

export const POST = createAIRoute<{ transcript: string }, ParseResult>({
  rateKey: "ai-parse-memo",
  perMinute: 10,
  perDay: 100,
  parseBody: (raw) => {
    const obj = raw as { transcript?: unknown };
    if (typeof obj.transcript !== "string" || !obj.transcript.trim()) {
      throw new AIBadRequest("transcript required");
    }
    return { transcript: obj.transcript };
  },
  handler: async ({ body }) => {
    const prompt = `다음은 사용자가 음식점에 다녀와서 음성으로 말한 내용을 받아쓴 것이야.
여기서 맛집 정보를 추출해 JSON으로 출력해.

**받아쓴 내용:**
"${body.transcript.replace(/"/g, '\\"').slice(0, 500)}"

**추출 규칙:**
- name: 식당 이름 (지역명 포함 가능, 예: "강남 본가", "성수 어니언"). 분명히 추출 가능하면, 아니면 null
- category: 한식·중식·일식·양식·카페·술집·디저트·기타 중 하나, 모르겠으면 null
- memo: 사용자의 감상·메뉴·분위기를 한 문장으로 정리 (60자 내외). 단순 사실만 있으면 null

**출력 (JSON만):**
{
  "name": <문자열|null>,
  "category": <문자열|null>,
  "memo": <문자열|null>
}`;

    const result = await generateJSON<ParseResult>(prompt, {
      temperature: 0.3,
      maxOutputTokens: 300,
    });

    if (result.category && !VALID_CATEGORIES.includes(result.category)) result.category = null;
    return result;
  },
});
