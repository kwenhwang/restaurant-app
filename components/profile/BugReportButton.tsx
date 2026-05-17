"use client";

import { useState, useTransition } from "react";

interface Props {
  submit: (input: { message: string; url?: string; userAgent?: string }) => Promise<void>;
}

export default function BugReportButton({ submit }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setMessage("");
    setDone(false);
    setError(null);
  }

  function close() {
    if (pending) return;
    setOpen(false);
    setTimeout(reset, 200);
  }

  function send() {
    if (message.trim().length < 3) {
      setError("내용을 더 자세히 적어 주세요");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await submit({
          message,
          url: typeof window !== "undefined" ? window.location.href : undefined,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        });
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "전송 실패");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between rounded-2xl px-4 h-12"
        style={{ background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <span className="flex items-center gap-3">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-[14px]"
            style={{ background: "var(--bg)" }}
          >
            🐞
          </span>
          <span className="text-[15px] font-medium">오류 신고</span>
        </span>
        <span style={{ color: "var(--text-3)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={close}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-bold">오류 신고</h3>
              <button
                type="button"
                onClick={close}
                disabled={pending}
                aria-label="닫기"
                className="w-7 h-7 rounded-full flex items-center justify-center text-[16px]"
                style={{ background: "var(--bg)" }}
              >
                ×
              </button>
            </div>

            {done ? (
              <div className="py-6 text-center space-y-2">
                <div className="text-[40px]">💌</div>
                <p className="text-[16px] font-semibold">접수됐어요</p>
                <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
                  빠르게 살펴보고 개선할게요. 고마워요!
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-3 h-11 px-6 rounded-2xl text-white font-bold"
                  style={{ background: "var(--accent)" }}
                >
                  확인
                </button>
              </div>
            ) : (
              <>
                <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
                  어떤 문제가 있었나요? 자세히 적어주실수록 빠르게 고칠 수 있어요.
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="예: 사진 업로드가 안 돼요. 누르면 로딩만 계속됩니다."
                  className="w-full rounded-2xl p-3 text-[14px] outline-none resize-none"
                  style={{ background: "var(--bg)", color: "var(--text)" }}
                />
                <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--text-2)" }}>
                  <span>현재 페이지 주소와 기기 정보가 함께 전송돼요</span>
                  <span>{message.length}/2000</span>
                </div>
                {error && (
                  <p className="text-[13px]" style={{ color: "#FF3B30" }}>
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={close}
                    disabled={pending}
                    className="flex-1 h-12 rounded-2xl font-semibold disabled:opacity-50"
                    style={{ background: "var(--bg)", color: "var(--text)" }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={send}
                    disabled={pending || message.trim().length < 3}
                    className="flex-1 h-12 rounded-2xl text-white font-bold disabled:opacity-50"
                    style={{ background: "var(--accent)" }}
                  >
                    {pending ? "전송 중…" : "보내기"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
