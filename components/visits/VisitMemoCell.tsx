"use client";

// Tap-to-edit memo cell for a single visit row. Same pattern as InlineMemo
// (restaurant note), scoped to one visit.

import { useEffect, useRef, useState, useTransition } from "react";
import {
  updateVisitMemo,
  deleteVisit,
} from "@/app/(main)/restaurants/[id]/visit-memo-action";
import { haptic } from "@/lib/haptic";

interface Props {
  visitId: string;
  restaurantId: string;
  initial: string | null;
}

export default function VisitMemoCell({ visitId, restaurantId, initial }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      taRef.current?.focus();
      const el = taRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  function commit() {
    const next = value.trim();
    if (next === saved.trim()) {
      setEditing(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateVisitMemo(visitId, restaurantId, next);
      if ("error" in res) {
        haptic("error");
        setError(res.error);
        return;
      }
      haptic("light");
      setSaved(next);
      setEditing(false);
    });
  }

  function cancel() {
    setValue(saved);
    setError(null);
    setEditing(false);
  }

  function remove() {
    if (!window.confirm("이 방문 기록을 삭제할까요?")) return;
    startTransition(async () => {
      await deleteVisit(visitId, restaurantId);
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="방문 메모 편집"
        className="block w-full text-left text-[14px] leading-relaxed"
        style={{ color: saved ? "var(--text)" : "var(--text-3)" }}
      >
        {saved || "메모 추가하기 +"}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 1000))}
        rows={Math.min(6, Math.max(2, value.split("\n").length + 1))}
        placeholder="이번 방문 어땠어요?"
        className="w-full bg-transparent outline-none text-[14px] leading-relaxed resize-none"
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
        <p className="text-[12px]" style={{ color: "var(--error)" }}>
          ⚠️ {error}
        </p>
      )}
      <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--text-3)" }}>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="font-semibold"
          style={{ color: "var(--error)" }}
        >
          이 방문 삭제
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="h-8 px-3 rounded-full text-[12px] font-bold"
            style={{ background: "var(--bg)", color: "var(--text-2)" }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={commit}
            disabled={pending}
            className="h-8 px-3 rounded-full text-[12px] font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            {pending ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
