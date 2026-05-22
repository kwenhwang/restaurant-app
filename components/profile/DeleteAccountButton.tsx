"use client";

import { useState, useTransition } from "react";

interface Props {
  deleteAccount: () => Promise<void>;
}

export default function DeleteAccountButton({ deleteAccount }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (confirmText !== "삭제") {
      setError('확인을 위해 "삭제"를 정확히 입력해 주세요');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await deleteAccount();
      } catch (e) {
        setError(e instanceof Error ? e.message : "삭제 실패");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-11 rounded-2xl text-[14px] font-semibold"
        style={{ background: "transparent", color: "#FF3B30" }}
      >
        계정 삭제
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[17px] font-bold">계정을 삭제할까요?</h3>
            <p className="text-[14px]" style={{ color: "var(--text-2)" }}>
              아래 데이터가 <strong style={{ color: "#FF3B30" }}>모두 영구 삭제</strong>되며,
              복구할 수 없어요.
            </p>
            <ul
              className="text-[13px] rounded-2xl p-3 list-disc list-inside space-y-1"
              style={{ background: "var(--bg)", color: "var(--text-2)" }}
            >
              <li>등록한 모든 맛집과 방문 기록</li>
              <li>업로드한 모든 사진</li>
              <li>오류 신고 내역</li>
              <li>계정 (이메일·비밀번호)</li>
            </ul>
            <div>
              <label
                className="text-[12px] font-semibold"
                style={{ color: "var(--text-2)" }}
              >
                확인을 위해 &ldquo;삭제&rdquo; 를 입력해 주세요
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="삭제"
                className="w-full mt-1 rounded-2xl px-4 py-2.5 text-[15px] outline-none"
                style={{ background: "var(--bg)" }}
                disabled={pending}
              />
            </div>
            {error && (
              <p className="text-[13px]" style={{ color: "#FF3B30" }}>
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="flex-1 h-12 rounded-2xl font-semibold disabled:opacity-50"
                style={{ background: "var(--bg)", color: "var(--text)" }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending || confirmText !== "삭제"}
                className="flex-1 h-12 rounded-2xl text-white font-bold disabled:opacity-50"
                style={{ background: "#FF3B30" }}
              >
                {pending ? "삭제 중…" : "영구 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
