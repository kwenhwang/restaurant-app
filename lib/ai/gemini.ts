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
