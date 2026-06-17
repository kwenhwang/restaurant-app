"use client";

import { useState } from "react";
import Sym from "@/components/ui/Sym";
import FeedbackThumbs from "@/components/feedback/FeedbackThumbs";

interface Reviews {
  found: boolean;
  summary: string;
  pros: string[];
  cons: string[];
  highlights: string[];
  source_hint?: string;
  sources?: { url: string; title?: string }[];
}

interface Props {
  restaurantId: string;
  initial?: Reviews | null;
}

export default function BlogReviewsSection({ restaurantId, initial }: Props) {
  const [data, setData] = useState<Reviews | null>(initial ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchReviews(force = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/find-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, force }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "검색 실패");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }

  // Empty state — show CTA
  if (!data && !loading && !error) {
    return (
      <button
        type="button"
        onClick={() => fetchReviews(false)}
        className="w-full rounded-2xl py-3 text-[14px] font-semibold flex items-center justify-center gap-1.5"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        ✨ 블로그 후기 요약
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", boxShadow: "var(--shadow-1, 0 1px 2px rgba(0,0,0,0.04))" }}
    >
      {loading && (
        <div
          className="px-4 py-3 text-[13px] flex items-center gap-2"
          style={{ color: "var(--text-2)" }}
        >
          <span
            className="inline-block w-3 h-3 rounded-full border-2"
            style={{
              borderColor: "var(--accent)",
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
          블로그·맛집 글 모으는 중…
        </div>
      )}

      {error && !loading && (
        <div className="px-4 py-3">
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
            ⚠️ {error}
          </p>
          <button
            type="button"
            onClick={() => fetchReviews(true)}
            className="mt-2 text-[12px] font-semibold"
            style={{ color: "var(--accent)" }}
          >
            다시 시도
          </button>
        </div>
      )}

      {data && data.found && (
        <>
          {/* Summary band */}
          <div
            className="px-4 py-3 text-[14px] font-semibold leading-relaxed"
            style={{ background: "var(--accent-soft)", color: "var(--text)" }}
          >
            {data.summary}
          </div>

          <div className="p-4 space-y-3">
            {data.pros.length > 0 && (
              <div>
                <div
                  className="text-[11px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--text-2)" }}
                >
                  👍 좋은 점
                </div>
                <ul className="space-y-1">
                  {data.pros.map((p, i) => (
                    <li key={i} className="text-[14px] flex gap-2">
                      <span style={{ color: "var(--accent)" }}>·</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.cons.length > 0 && (
              <div>
                <div
                  className="text-[11px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--text-2)" }}
                >
                  ⚠️ 알아두면 좋은 점
                </div>
                <ul className="space-y-1">
                  {data.cons.map((c, i) => (
                    <li key={i} className="text-[14px] flex gap-2" style={{ color: "var(--text-2)" }}>
                      <span>·</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.highlights.length > 0 && (
              <div>
                <div
                  className="text-[11px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--text-2)" }}
                >
                  ✨ 하이라이트
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="text-[12px] px-2 py-1 rounded-full"
                      style={{ background: "var(--bg)", color: "var(--text)" }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(data.source_hint || (data.sources && data.sources.length > 0)) && (
              <div className="pt-2" style={{ borderTop: "0.5px solid var(--separator)" }}>
                {data.source_hint && (
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                    출처: {data.source_hint}
                  </p>
                )}
                {data.sources && data.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {data.sources.slice(0, 4).map((s, i) => {
                      let host = "";
                      try {
                        host = new URL(s.url).hostname.replace(/^www\./, "");
                      } catch {}
                      return (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--bg)", color: "var(--text-2)" }}
                        >
                          ↗ {host || `링크${i + 1}`}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-1">
              <button
                type="button"
                onClick={() => fetchReviews(true)}
                disabled={loading}
                className="text-[12px] font-semibold"
                style={{ color: "var(--text-3)" }}
              >
                <Sym name="sparkles" size={10} /> 다시 요약
              </button>
              <FeedbackThumbs
                surface="review"
                target={restaurantId}
                context={{ summary: data.summary }}
              />
            </div>
          </div>
        </>
      )}

      {data && !data.found && (
        <div className="px-4 py-4">
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
            아직 블로그 후기를 찾지 못했어요. 인지도가 낮거나 신상 가게일 수 있어요.
          </p>
          <button
            type="button"
            onClick={() => fetchReviews(true)}
            className="mt-2 text-[12px] font-semibold"
            style={{ color: "var(--accent)" }}
          >
            🔄 다시 시도
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
