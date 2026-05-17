"use client";

import { useState, useTransition } from "react";
import type { MenuData } from "@/app/(main)/restaurants/[id]/menu-action";

interface FindResult {
  found: boolean;
  items: { name: string; price: string | null }[];
  price_range: string | null;
  summary: string;
  source_hint: string;
  sources?: { url: string; title?: string }[];
  can_retry?: boolean;
  from_cache?: boolean;
}

interface ErrorResult {
  error: string;
  code?: "QUOTA_EXCEEDED" | "AI_ERROR";
}

interface Props {
  restaurantId: string;
  saveMenu: (restaurantId: string, menu: MenuData) => Promise<void>;
}

export default function FindMenuButton({ restaurantId, saveMenu }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FindResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function find(force = false) {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/find-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, force }),
      });
      const data = (await res.json()) as FindResult | ErrorResult;
      if (!res.ok || "error" in data) {
        const errData = data as ErrorResult;
        setErrorCode(errData.code ?? "AI_ERROR");
        throw new Error(errData.error ?? "검색 실패");
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!result || result.items.length === 0) return;
    startTransition(async () => {
      try {
        await saveMenu(restaurantId, {
          items: result.items,
          price_range: result.price_range,
          summary: result.summary,
          source: "ai-vision",
        });
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setResult(null);
        }, 1500);
      } catch {
        setError("저장 실패");
      }
    });
  }

  if (!result && !loading && !error) {
    return (
      <button
        type="button"
        onClick={find}
        className="w-full rounded-2xl py-3 text-[14px] font-semibold flex items-center justify-center gap-1.5"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        🔍 인터넷에서 메뉴 찾기
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,111,61,0.10), rgba(217,74,30,0.05))",
        boxShadow: "inset 0 0 0 0.5px var(--separator)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: "var(--accent)" }}>🔍</span>
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: "var(--accent)" }}
        >
          인터넷 검색 결과
        </span>
      </div>

      {loading && (
        <div className="text-[13px] flex items-center gap-2" style={{ color: "var(--text-2)" }}>
          <span
            className="inline-block w-3 h-3 rounded-full border-2"
            style={{
              borderColor: "var(--accent)",
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
          웹에서 메뉴 검색 중… (5~10초)
        </div>
      )}

      {error && (
        <>
          <div className="flex items-start gap-2">
            <span className="text-[14px]">
              {errorCode === "QUOTA_EXCEEDED" ? "⏳" : "⚠️"}
            </span>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setError(null); setErrorCode(null); find(); }}
            className="mt-2 text-[12px] font-semibold"
            style={{ color: "var(--accent)" }}
          >
            다시 시도
          </button>
        </>
      )}

      {result && !result.found && (
        <>
          <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
            {result.summary}
          </div>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
            메뉴판 사진을 직접 올려도 좋아요.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => find(true)}
              className="flex-1 h-9 rounded-xl text-white text-[13px] font-bold"
              style={{ background: "var(--accent)" }}
            >
              🔄 다시 찾기
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="px-4 h-9 rounded-xl text-[13px] font-semibold"
              style={{ background: "white", color: "var(--text-2)" }}
            >
              닫기
            </button>
          </div>
        </>
      )}

      {result && result.found && result.items.length > 0 && (
        <>
          <p className="text-[13px] font-semibold">{result.summary}</p>
          <ul className="mt-2 space-y-1">
            {result.items.slice(0, 12).map((item, i) => (
              <li
                key={i}
                className="text-[13px] flex justify-between gap-2"
              >
                <span>{item.name}</span>
                <span style={{ color: "var(--text-2)" }}>
                  {item.price ?? ""}
                </span>
              </li>
            ))}
          </ul>
          {result.price_range && (
            <div
              className="text-[12px] mt-2 font-mono"
              style={{ color: "var(--text-2)" }}
            >
              가격대: {result.price_range}
            </div>
          )}
          {result.source_hint && (
            <p className="text-[11px] mt-2" style={{ color: "var(--text-3)" }}>
              출처: {result.source_hint}
            </p>
          )}
          {result.sources && result.sources.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {result.sources.slice(0, 3).map((s, i) => {
                let host = "";
                try { host = new URL(s.url).hostname.replace(/^www\./, ""); } catch {}
                return (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.7)", color: "var(--text-2)" }}
                  >
                    ↗ {host || `링크${i + 1}`}
                  </a>
                );
              })}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={save}
              disabled={pending || saved}
              className="flex-1 h-9 rounded-xl text-white text-[13px] font-bold disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {saved ? "저장됨 ✓" : pending ? "저장 중…" : "메뉴로 저장"}
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="px-4 h-9 rounded-xl text-[13px] font-semibold"
              style={{ background: "white", color: "var(--text-2)" }}
            >
              닫기
            </button>
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
