"use client";

import { useState } from "react";

interface Props {
  provisioned: boolean;
}

export default function UpgradeCTA({ provisioned }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "결제 시작에 실패했어요");
      }
      window.location.assign(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
      setLoading(false);
    }
  }

  if (!provisioned) {
    return (
      <div
        className="mt-5 h-12 px-6 rounded-full inline-flex items-center justify-center w-full text-[15px] font-bold opacity-80"
        style={{ background: "rgba(255,255,255,0.18)", color: "white" }}
      >
        결제 시스템 준비 중 — 곧 열려요
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="mt-5 inline-flex items-center gap-2 h-12 px-6 rounded-full text-[15px] font-extrabold w-full justify-center transition-transform active:scale-[0.98] disabled:opacity-60"
        style={{ background: "white", color: "var(--accent-press)" }}
      >
        {loading ? "이동 중…" : "1개월 무료로 시작"}
      </button>
      {error && <p className="text-[12px] mt-2 text-white opacity-95">⚠️ {error}</p>}
    </>
  );
}
