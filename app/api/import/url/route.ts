// app/api/import/url/route.ts
// Best-effort metadata extractor for pasted URLs.
//
// Targets: Instagram public posts, blog posts (네이버/티스토리), Threads.
// For Instagram, public posts expose OG/Twitter card meta but Instagram
// frequently rate-limits unauthenticated fetches and may require a logged-in
// session. We do best effort: send a browser-like UA, parse the HTML head,
// and let the caller fall through to manual entry if extraction fails.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface ExtractResult {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site: string | null;
  hashtags: string[];
}

const FETCH_TIMEOUT_MS = 6000;
const MAX_HTML_BYTES = 800 * 1024;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/17.0 Safari/605.1.15";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = checkRateLimit({ key: `${user.id}:import-url`, perMinute: 10, perDay: 100 });
  const rlRes = rateLimitResponse(rl);
  if (rlRes) return rlRes;

  const { url } = await request.json().catch(() => ({}));
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "유효한 URL이 필요해요." }, { status: 400 });
  }

  // Resolve once to normalize
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "URL 형식이 올바르지 않아요." }, { status: 400 });
  }

  // SSRF guard: only allow http/https, no localhost / private ranges
  if (!/^https?:$/.test(target.protocol)) {
    return NextResponse.json({ error: "허용되지 않은 프로토콜이에요." }, { status: 400 });
  }
  const host = target.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return NextResponse.json({ error: "내부 주소는 가져올 수 없어요." }, { status: 400 });
  }

  let html: string;
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.5",
      },
      redirect: "follow",
      signal: ac.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      return NextResponse.json(
        { error: `URL을 불러올 수 없어요 (${res.status})` },
        { status: 502 },
      );
    }

    const ct = res.headers.get("content-type") ?? "";
    if (!/(html|xml)/i.test(ct)) {
      return NextResponse.json({ error: "HTML 페이지가 아니에요." }, { status: 415 });
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "응답 본문을 읽을 수 없어요." }, { status: 502 });
    }
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_HTML_BYTES) break;
      chunks.push(value);
    }
    reader.cancel().catch(() => {});

    const merged = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      merged.set(c.subarray(0, Math.min(c.length, MAX_HTML_BYTES - off)), off);
      off += c.length;
      if (off >= MAX_HTML_BYTES) break;
    }

    html = new TextDecoder("utf-8", { fatal: false }).decode(merged);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "네트워크 오류";
    const isTimeout = /abort/i.test(msg);
    return NextResponse.json(
      {
        error: isTimeout
          ? "응답이 너무 오래 걸려요. 다른 URL을 시도해 주세요."
          : "URL을 가져오는 중 오류가 발생했어요.",
      },
      { status: 504 },
    );
  }

  const meta = parseMeta(html);
  const hashtags = extractHashtags(`${meta.title ?? ""} ${meta.description ?? ""}`);

  const result: ExtractResult = {
    url: target.toString(),
    title: meta.title,
    description: meta.description,
    image: meta.image,
    site: meta.site ?? target.hostname.replace(/^www\./, ""),
    hashtags,
  };

  return NextResponse.json(result);
}

function parseMeta(html: string): {
  title: string | null;
  description: string | null;
  image: string | null;
  site: string | null;
} {
  // Grab the <head> region to bound regex work
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const head = headMatch?.[1] ?? html.slice(0, 80_000);

  const ogTitle = pickMeta(head, "og:title");
  const twTitle = pickMeta(head, "twitter:title");
  const titleTag = head.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;

  const ogDesc = pickMeta(head, "og:description");
  const twDesc = pickMeta(head, "twitter:description");
  const nameDesc = pickMeta(head, "description", "name");

  const ogImage = pickMeta(head, "og:image");
  const twImage = pickMeta(head, "twitter:image");

  const siteName = pickMeta(head, "og:site_name");

  return {
    title: ogTitle ?? twTitle ?? titleTag,
    description: ogDesc ?? twDesc ?? nameDesc,
    image: ogImage ?? twImage,
    site: siteName,
  };
}

function pickMeta(head: string, key: string, attr: "property" | "name" = "property"): string | null {
  // Try property="og:..." then name="..."
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escaped}["']`, "i"),
  ];
  for (const p of patterns) {
    const m = head.match(p);
    if (m?.[1]) return decodeEntities(m[1]).trim();
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

function extractHashtags(text: string): string[] {
  const tags = new Set<string>();
  for (const m of text.matchAll(/#([\p{L}\p{N}_]{2,30})/gu)) {
    tags.add(m[1]);
  }
  return [...tags].slice(0, 10);
}
