"use client";

import { useState, useTransition } from "react";

interface MenuItem {
  name: string;
  price: string | null;
}

interface MenuResult {
  items: MenuItem[];
  price_range: string | null;
  summary: string;
}

interface Props {
  restaurantId: string;
  imageId: string;
  appendNote: (restaurantId: string, addition: string) => Promise<void>;
}

export default function MenuExtractor({ restaurantId, imageId, appendNote }: Props) {
  const [result, setResult] = useState<MenuResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  async function extract() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/extract-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }

  function applyToMemo() {
    if (!result || result.items.length === 0) return;
    const lines = [
      result.summary,
      ...result.items.slice(0, 8).map(
        (i) => `• ${i.name}${i.price ? ` — ${i.price}` : ""}`
      ),
    ];
    if (result.price_range) lines.push(`(${result.price_range})`);
    const addition = lines.join("\n");
    startTransition(async () => {
      try {
        await appendNote(restaurantId, addition);
        setApplied(true);
        setTimeout(() => setApplied(false), 2000);
      } catch {
        setError("메모 저장 실패");
      }
    });
  }

  if (!result && !loading) {
    return (
      <button
        type="button"
        onClick={extract}
        className="rounded-full text-[12px] font-semibold px-3 py-1.5 flex items-center gap-1"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        📋 메뉴 추출
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
        <span style={{ color: "var(--accent)" }}>📋</span>
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: "var(--accent)" }}
        >
          메뉴 추출
        </span>
      </div>

      {loading && (
        <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
          메뉴 분석 중…
        </div>
      )}

      {error && (
        <div className="text-[13px]" style={{ color: "#FF3B30" }}>
          {error}
        </div>
      )}

      {result && result.items.length === 0 && (
        <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
          {result.summary}
        </div>
      )}

      {result && result.items.length > 0 && (
        <>
          <p className="text-[13px] font-semibold">{result.summary}</p>
          <ul className="mt-2 space-y-1">
            {result.items.slice(0, 8).map((item, i) => (
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
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={applyToMemo}
              disabled={pending || applied}
              className="flex-1 h-9 rounded-xl text-white text-[13px] font-bold disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {applied ? "메모에 추가됨 ✓" : pending ? "추가 중…" : "메모에 추가"}
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
    </div>
  );
}
