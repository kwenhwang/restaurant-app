"use client";

// 링크에서 가져오기 — 인스타·블로그 URL 붙여넣기 → 메타데이터/이미지 추출
// → AI로 식당 정보 파싱 → 미리보기 → 등록.
//
// 사진은 외부 URL 그대로 image_url 필드로 저장 (다운로드는 별도 마이그레이션 작업).

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Sym from "@/components/ui/Sym";
import { createClient } from "@/lib/supabase/client";

interface Extracted {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site: string | null;
  hashtags: string[];
}

interface Parsed {
  name: string | null;
  address: string | null;
  category: string | null;
  rating: number | null;
}

const HOSTS_TIPS: Record<string, string> = {
  "instagram.com": "공개 게시물만 가져올 수 있어요. 비공개 계정은 안 돼요.",
  "naver.com": "네이버 블로그·뷰 글에서 작동해요.",
  "tistory.com": "티스토리 블로그 글에서 작동해요.",
  "threads.net": "Threads 공개 게시물에서 작동해요.",
};

function hostHint(url: string): string | null {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    for (const key of Object.keys(HOSTS_TIPS)) {
      if (h.includes(key)) return HOSTS_TIPS[key];
    }
  } catch {}
  return null;
}

export default function ImportFromUrl() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [note, setNote] = useState("");

  async function handleFetch(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setError(null);
    setExtracted(null);
    setParsed(null);

    setFetching(true);
    let ex: Extracted | null = null;
    try {
      const res = await fetch("/api/import/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "URL 추출 실패");
      ex = json as Extracted;
      setExtracted(ex);
      setNote([ex.title, ex.description].filter(Boolean).join("\n\n").slice(0, 500));
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "URL 추출 실패");
      setFetching(false);
      return;
    }
    setFetching(false);

    // AI parse
    const text = [
      ex.title,
      ex.description,
      ex.hashtags.length ? "#" + ex.hashtags.join(" #") : null,
      ex.url,
    ]
      .filter(Boolean)
      .join("\n");
    if (!text.trim()) return;

    setParsing(true);
    try {
      const res = await fetch("/api/ai/parse-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (res.ok && !json.error) setParsed(json as Parsed);
    } catch {
      // Soft fail — user can still edit and save manually
    } finally {
      setParsing(false);
    }
  }

  async function save() {
    if (!parsed?.name) {
      setError("식당 이름을 찾지 못했어요. 다른 링크를 시도해 주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요해요");

      let lat: number | null = null;
      let lng: number | null = null;
      if (parsed.address) {
        try {
          const geoRes = await fetch(
            `/api/kakao/address?query=${encodeURIComponent(parsed.address)}`,
          );
          if (geoRes.ok) {
            const g = await geoRes.json();
            if (g.lat && g.lng) {
              lat = parseFloat(g.lat);
              lng = parseFloat(g.lng);
            }
          }
        } catch {}
      }

      const { data, error: insertErr } = await supabase
        .from("restaurants")
        .insert({
          user_id: user.id,
          name: parsed.name,
          address: parsed.address,
          lat,
          lng,
          category: parsed.category,
          rating: parsed.rating,
          note: note.trim() || null,
        })
        .select("id")
        .single();
      if (insertErr || !data) throw new Error(insertErr?.message ?? "저장 실패");

      router.push(`/restaurants/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
      setSaving(false);
    }
  }

  const tip = url.trim() ? hostHint(url.trim()) : null;
  const busy = fetching || parsing || saving;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <Link href="/" className="text-[15px]" style={{ color: "var(--text-2)" }}>
          취소
        </Link>
        <span className="text-[17px] font-bold" style={{ letterSpacing: "-0.3px" }}>
          링크에서 가져오기
        </span>
        <span style={{ width: 36 }} />
      </header>

      <form onSubmit={handleFetch} className="px-4 mt-1">
        <div
          className="rounded-2xl p-3"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
        >
          <div
            className="text-[11px] font-bold uppercase tracking-wider mb-1.5"
            style={{ color: "var(--text-2)" }}
          >
            인스타 · 블로그 URL
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/..."
            inputMode="url"
            className="w-full bg-transparent border-0 outline-none text-[14px]"
            disabled={busy}
          />
        </div>
        {tip && (
          <p className="text-[11.5px] mt-1.5 px-1" style={{ color: "var(--text-3)" }}>
            💡 {tip}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="w-full h-12 mt-3 rounded-full text-[15px] font-bold text-white transition-opacity"
          style={{
            background: "var(--accent)",
            opacity: busy || !url.trim() ? 0.5 : 1,
          }}
        >
          {fetching ? "가져오는 중…" : parsing ? "분석 중…" : "가져오기"}
        </button>
      </form>

      {error && (
        <div className="px-4 mt-3">
          <div className="rounded-2xl p-3 text-[13px]" style={{ background: "var(--surface)", color: "var(--text-2)" }}>
            ⚠️ {error}
          </div>
        </div>
      )}

      {extracted && (
        <div className="px-4 mt-4 space-y-3 pb-24">
          {extracted.image && (
            <div
              className="relative w-full overflow-hidden rounded-2xl"
              style={{ aspectRatio: "4/3", background: "var(--surface)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={extracted.image}
                alt={extracted.title ?? ""}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
          >
            <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-3)" }}>
              <Sym name="link" size={11} />
              <span className="truncate">{extracted.site ?? new URL(extracted.url).hostname}</span>
            </div>

            <div>
              <label
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--text-2)" }}
              >
                식당 이름
              </label>
              <input
                type="text"
                value={parsed?.name ?? ""}
                onChange={(e) =>
                  setParsed((p) => ({
                    name: e.target.value,
                    address: p?.address ?? null,
                    category: p?.category ?? null,
                    rating: p?.rating ?? null,
                  }))
                }
                placeholder={parsing ? "분석 중…" : "AI가 찾지 못함 — 직접 입력"}
                className="w-full mt-1 bg-transparent border-0 outline-none text-[18px] font-display font-bold"
              />
            </div>

            <div>
              <label
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--text-2)" }}
              >
                주소
              </label>
              <input
                type="text"
                value={parsed?.address ?? ""}
                onChange={(e) =>
                  setParsed((p) => ({
                    name: p?.name ?? null,
                    address: e.target.value,
                    category: p?.category ?? null,
                    rating: p?.rating ?? null,
                  }))
                }
                placeholder={parsing ? "분석 중…" : "주소 (선택)"}
                className="w-full mt-1 bg-transparent border-0 outline-none text-[15px]"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-2)" }}
                >
                  카테고리
                </label>
                <select
                  value={parsed?.category ?? ""}
                  onChange={(e) =>
                    setParsed((p) => ({
                      name: p?.name ?? null,
                      address: p?.address ?? null,
                      category: e.target.value || null,
                      rating: p?.rating ?? null,
                    }))
                  }
                  className="w-full mt-1 bg-transparent border-0 outline-none text-[15px]"
                >
                  <option value="">선택…</option>
                  {["한식", "중식", "일식", "양식", "카페", "술집", "디저트", "기타"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-2)" }}
                >
                  별점
                </label>
                <select
                  value={parsed?.rating ?? ""}
                  onChange={(e) =>
                    setParsed((p) => ({
                      name: p?.name ?? null,
                      address: p?.address ?? null,
                      category: p?.category ?? null,
                      rating: e.target.value ? parseInt(e.target.value, 10) : null,
                    }))
                  }
                  className="w-full mt-1 bg-transparent border-0 outline-none text-[15px]"
                >
                  <option value="">—</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {"⭐".repeat(n)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--text-2)" }}
              >
                메모 (원문 발췌)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                rows={3}
                className="w-full mt-1 bg-transparent border-0 outline-none text-[14px] resize-none"
              />
            </div>

            {extracted.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {extracted.hashtags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: "var(--bg)", color: "var(--text-2)" }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={save}
            disabled={busy || !parsed?.name}
            className="w-full h-12 rounded-full text-[15px] font-bold text-white"
            style={{
              background: "var(--accent)",
              opacity: busy || !parsed?.name ? 0.5 : 1,
            }}
          >
            {saving ? "저장 중…" : "맛집으로 등록"}
          </button>
        </div>
      )}
    </div>
  );
}
