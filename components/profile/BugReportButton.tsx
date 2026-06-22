"use client";

import { useEffect, useRef, useState, useTransition } from "react";

interface Props {
  submit: (formData: FormData) => Promise<void>;
}

export default function BugReportButton({ submit }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Paste image directly from clipboard while modal is open
  useEffect(() => {
    if (!open) return;
    function onPaste(e: ClipboardEvent) {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      if (!item) return;
      const f = item.getAsFile();
      if (f) attachFile(f);
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function attachFile(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("이미지 파일만 첨부 가능해요");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("이미지가 너무 커요 (최대 5MB)");
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function removeFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function reset() {
    setMessage("");
    removeFile();
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
        const fd = new FormData();
        fd.append("message", message);
        fd.append("url", window.location.href);
        fd.append("userAgent", navigator.userAgent);
        if (file) fd.append("file", file);
        await submit(fd);
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
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3 max-h-[92vh] overflow-y-auto"
            style={{ background: "var(--surface)" }}
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

                {/* Screenshot upload area */}
                {previewUrl ? (
                  <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{ background: "var(--bg)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="첨부 미리보기"
                      className="w-full max-h-[240px] object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeFile}
                      aria-label="첨부 제거"
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
                    >
                      ×
                    </button>
                    <div
                      className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-[11px] font-semibold text-white"
                      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
                    >
                      {file ? `${(file.size / 1024).toFixed(0)} KB · ${file.name.slice(0, 24)}` : "첨부됨"}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full rounded-2xl py-3 text-[13px] font-semibold flex items-center justify-center gap-1.5"
                    style={{ background: "var(--bg)", color: "var(--text-2)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    스크린샷 첨부 (선택)
                  </button>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) attachFile(f);
                  }}
                  className="hidden"
                />

                <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--text-2)" }}>
                  <span>주소·기기 정보가 함께 전송돼요</span>
                  <span>{message.length}/2000</span>
                </div>
                {error && (
                  <p className="text-[13px]" style={{ color: "var(--error)" }}>
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
