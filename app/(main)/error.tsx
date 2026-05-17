"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="text-[20px] font-bold mb-1">문제가 발생했어요</h2>
      <p className="text-[14px] mb-5" style={{ color: "var(--text-2)" }}>
        잠시 후 다시 시도해 보세요
      </p>
      <button
        onClick={reset}
        className="h-[44px] px-6 rounded-2xl text-white font-semibold"
        style={{ background: "var(--accent)" }}
      >
        다시 시도
      </button>
      {error.digest && (
        <p className="text-[11px] mt-4 font-mono" style={{ color: "var(--text-2)" }}>
          {error.digest}
        </p>
      )}
    </div>
  );
}
