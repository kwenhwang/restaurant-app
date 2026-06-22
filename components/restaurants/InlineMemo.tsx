"use client";

// Inline editable memo on the restaurant detail page. Tap to edit, save
// pushes through saveNote() server action. Empty state shows "메모 추가" CTA
// so users can add a memo without ever leaving the detail page.

import { useEffect, useRef, useState, useTransition } from "react";
import Sym from "@/components/ui/Sym";
import { saveNote } from "@/app/(main)/restaurants/[id]/note-action";

interface Props {
  restaurantId: string;
  initial: string | null;
}

export default function InlineMemo({ restaurantId, initial }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      // Move cursor to end
      const el = textareaRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  function startEdit() {
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setValue(saved);
    setError(null);
    setEditing(false);
  }

  function commit() {
    const next = value.trim();
    if (next === saved) {
      setEditing(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await saveNote(restaurantId, next);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setSaved(next);
      setEditing(false);
    });
  }

  if (!editing && !saved) {
    return (
      <button
        type="button"
        onClick={startEdit}
        className="w-full rounded-2xl py-3 text-[14px] font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
        style={{ background: "var(--accent-soft)", color: "var(--accent-press)" }}
      >
        <Sym name="pencil" size={14} /> 메모 추가
      </button>
    );
  }

  return (
    <div
      className="p-5"
      style={{ borderRadius: 20, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
    >
      {!editing ? (
        <button
          type="button"
          onClick={startEdit}
          className="w-full text-left"
          aria-label="메모 편집"
        >
          <div className="font-display text-[46px]" style={{ color: "var(--accent)", lineHeight: 0.3, height: 22 }}>“</div>
          <p className="font-display text-[17px] font-medium leading-[1.7] whitespace-pre-wrap">
            {saved}
          </p>
          <div className="mt-3 text-[12px] font-semibold flex items-center gap-1" style={{ color: "var(--text-3)" }}>
            <Sym name="pencil" size={11} /> 탭해서 편집
          </div>
        </button>
      ) : (
        <>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, 2000))}
            rows={Math.min(10, Math.max(3, value.split("\n").length + 1))}
            placeholder="이 가게에 대한 메모를 적어두세요"
            className="w-full bg-transparent outline-none text-[16px] leading-[1.6] resize-none"
            style={{ color: "var(--text)" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
          />
          {error && (
            <p className="text-[12px] mt-2" style={{ color: "var(--error)" }}>
              ⚠️ {error}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
              {value.length}/2000 · ⌘+Enter로 저장
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancel}
                disabled={pending}
                className="h-9 px-4 rounded-full text-[13px] font-bold"
                style={{ background: "var(--bg)", color: "var(--text-2)" }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={commit}
                disabled={pending}
                className="h-9 px-4 rounded-full text-[13px] font-bold text-white"
                style={{ background: "var(--accent)" }}
              >
                {pending ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
