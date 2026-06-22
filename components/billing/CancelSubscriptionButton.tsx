"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CancelSubscriptionButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (pending) return;
    if (!window.confirm("구독을 해지할까요? 다음 결제일까지는 그대로 사용 가능해요.")) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "해지 요청에 실패했어요");
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <div
        className="rounded-2xl p-4 text-[13.5px]"
        style={{ background: "var(--accent-soft)", color: "var(--accent-press)" }}
      >
        ✓ 해지 신청 완료. 다음 결제일까지 그대로 사용 가능해요.
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="w-full h-12 rounded-full text-[14px] font-bold"
        style={{ background: "var(--surface)", color: "var(--error)" }}
      >
        {pending ? "처리 중…" : "구독 해지"}
      </button>
      {error && (
        <p className="text-[12px] px-1" style={{ color: "var(--error)" }}>
          ⚠️ {error}
        </p>
      )}
    </>
  );
}
