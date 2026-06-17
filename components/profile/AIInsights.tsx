"use client";

import { useEffect, useState } from "react";

import FeedbackThumbs from "@/components/feedback/FeedbackThumbs";

const STORAGE_KEY = "ai-insights-cache";
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export default function AIInsights({ hasVisits }: { hasVisits: boolean }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasVisits) {
      setLoading(false);
      return;
    }
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < TTL_MS) {
          setText(parsed.text);
          setLoading(false);
          return;
        }
      }
    } catch {}
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData(force = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/insights", { cache: force ? "no-store" : "default" });
      if (!res.ok) throw new Error("인사이트를 불러올 수 없어요");
      const json: { text?: string; error?: string } = await res.json();
      if (json.error) throw new Error(json.error);
      setText(json.text ?? "");
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ text: json.text, timestamp: Date.now() }));
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }

  if (!hasVisits) return null;

  return (
    <section className="px-4 pt-5">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3
          className="text-[13px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: "var(--text-2)" }}
        >
          <SparkleIcon />
          AI 인사이트
        </h3>
        <button
          type="button"
          onClick={() => fetchData(true)}
          disabled={loading}
          aria-label="새로고침"
          className="text-[11px] font-semibold"
          style={{ color: "var(--accent)", opacity: loading ? 0.5 : 1 }}
        >
          {loading ? "분석 중…" : "새로고침"}
        </button>
      </div>
      <div
        className="rounded-2xl p-4 bg-white"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        {loading && !text && (
          <div className="space-y-2">
            <div className="h-3 w-full rounded-md" style={{ background: "var(--bg)" }} />
            <div className="h-3 w-5/6 rounded-md" style={{ background: "var(--bg)" }} />
            <div className="h-3 w-3/4 rounded-md" style={{ background: "var(--bg)" }} />
          </div>
        )}
        {error && !loading && (
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
            {error}
          </p>
        )}
        {text && (
          <>
            <p
              className="text-[14px] leading-relaxed"
              style={{ letterSpacing: "-0.2px" }}
            >
              {text}
            </p>
            <div className="mt-2.5 flex justify-end">
              <FeedbackThumbs
                surface="insights"
                target={insightTarget()}
                context={{ preview: text.slice(0, 200) }}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function insightTarget(): string {
  // Stable per calendar month — votes reset when a fresh insight is shown.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function SparkleIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ color: "var(--accent)" }}
    >
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
    </svg>
  );
}
