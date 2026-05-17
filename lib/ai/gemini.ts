/**
 * Minimal Gemini wrapper.
 * Using REST directly to avoid adding the @google/generative-ai dep.
 */

const MODEL = "gemini-2.5-flash";
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  promptFeedback?: { blockReason?: string };
}

export async function generateJSON<T>(prompt: string, opts?: { temperature?: number; maxOutputTokens?: number }): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");

  const res = await fetch(`${ENDPOINT(MODEL)}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: opts?.temperature ?? 0.7,
        maxOutputTokens: opts?.maxOutputTokens ?? 1024,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked: ${data.promptFeedback.blockReason}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned invalid JSON: " + text.slice(0, 200));
  }
}

/** Multi-modal JSON: send image + prompt, get JSON back. */
export async function generateJSONWithImage<T>(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  opts?: { temperature?: number; maxOutputTokens?: number }
): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");

  const res = await fetch(`${ENDPOINT(MODEL)}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: opts?.temperature ?? 0.4,
        maxOutputTokens: opts?.maxOutputTokens ?? 512,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked: ${data.promptFeedback.blockReason}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned invalid JSON: " + text.slice(0, 200));
  }
}

/**
 * Generate JSON using Google Search grounding. The model can search the web
 * and use results to ground its answer. Returns parsed JSON + grounding metadata.
 *
 * Note: responseMimeType: "application/json" is NOT compatible with tools,
 * so we instruct the model to wrap JSON in a ```json``` block and parse manually.
 */
export async function generateGroundedJSON<T>(
  prompt: string,
  opts?: { temperature?: number; maxOutputTokens?: number }
): Promise<{ data: T; sources: { uri: string; title?: string }[] }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");

  const res = await fetch(`${ENDPOINT(MODEL)}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: opts?.temperature ?? 0.3,
        maxOutputTokens: opts?.maxOutputTokens ?? 2000,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }

  const raw = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      groundingMetadata?: {
        groundingChunks?: { web?: { uri?: string; title?: string } }[];
      };
    }[];
    promptFeedback?: { blockReason?: string };
  };

  if (raw.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked: ${raw.promptFeedback.blockReason}`);
  }

  const text =
    raw.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("") ?? "";

  // Extract JSON from text (model may wrap in ```json...``` or output raw JSON)
  let jsonStr = text.trim();
  const fenced = jsonStr.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenced) jsonStr = fenced[1];
  else {
    // Find first { ... last } heuristic
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    if (start >= 0 && end > start) jsonStr = jsonStr.slice(start, end + 1);
  }

  let parsed: T;
  try {
    parsed = JSON.parse(jsonStr) as T;
  } catch {
    throw new Error("Gemini returned invalid JSON: " + text.slice(0, 200));
  }

  const sources = (raw.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [])
    .map((c) => c.web)
    .filter((w): w is { uri: string; title?: string } => !!w?.uri)
    .slice(0, 5);

  return { data: parsed, sources };
}

export async function generateText(prompt: string, opts?: { temperature?: number; maxOutputTokens?: number }): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");

  const res = await fetch(`${ENDPOINT(MODEL)}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts?.temperature ?? 0.7,
        maxOutputTokens: opts?.maxOutputTokens ?? 400,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked: ${data.promptFeedback.blockReason}`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}
