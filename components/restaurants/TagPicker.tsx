// components/restaurants/TagPicker.tsx
// Bottom-sheet multi-select. Grouped suggestions + free-text add.

"use client";

import { useState, useEffect } from "react";
import Sym from "@/components/ui/Sym";

const MAX_TAGS = 6;

const SUGGESTIONS: Array<{ title: string; tags: string[] }> = [
  {
    title: "분위기",
    tags: ["혼밥", "데이트", "가족모임", "회식", "조용함", "시끄러움", "뷰맛집", "아늑함"],
  },
  {
    title: "특징",
    tags: ["혼술", "점심줄", "예약필수", "주차가능", "24시간", "브런치", "심야"],
  },
  {
    title: "맛",
    tags: ["매콤한맛", "담백한맛", "진한맛", "깔끔한맛", "단맛", "시원한맛"],
  },
];

interface Props {
  initial: string[];
  onClose: () => void;
  onSave: (tags: string[]) => void;
}

export default function TagPicker({ initial, onClose, onSave }: Props) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function toggle(t: string) {
    setSelected((prev) =>
      prev.includes(t)
        ? prev.filter((x) => x !== t)
        : prev.length >= MAX_TAGS
        ? prev
        : [...prev, t]
    );
  }

  function addDraft() {
    const t = draft.trim().replace(/^#/, "");
    if (!t || selected.includes(t) || selected.length >= MAX_TAGS) {
      setDraft("");
      return;
    }
    setSelected((prev) => [...prev, t]);
    setDraft("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-[14px] flex flex-col"
        style={{ background: "var(--bg)", maxHeight: "88%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-2">
          <div className="w-9 h-[5px] rounded-[3px]" style={{ background: "rgba(60,60,67,0.25)" }} />
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-1">
          <button
            type="button"
            onClick={onClose}
            className="text-[15px]"
            style={{ color: "var(--text-2)" }}
          >
            취소
          </button>
          <span className="text-[17px] font-bold" style={{ letterSpacing: "-0.3px" }}>
            분위기 태그
          </span>
          <button
            type="button"
            onClick={() => onSave(selected)}
            className="text-[15px] font-bold"
            style={{ color: "var(--accent)" }}
          >
            완료
          </button>
        </div>

        {/* Count */}
        <div className="px-5 py-2 text-[13px]" style={{ color: "var(--text-2)" }}>
          <span
            className="font-bold tabular-nums"
            style={{ color: "var(--accent)" }}
          >
            {selected.length}
          </span>
          개 선택 · 최대 {MAX_TAGS}개까지
        </div>

        {/* Selected (always visible at top for quick deselect) */}
        {selected.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {selected.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                className="px-3 py-1.5 rounded-full text-[13px] font-semibold inline-flex items-center gap-1.5"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  boxShadow: "0 2px 6px rgba(255,111,61,0.28)",
                }}
              >
                <Sym name="xmark" size={10} strokeWidth={2.5} />
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Suggestions */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {SUGGESTIONS.map((g) => (
            <div key={g.title}>
              <div
                className="text-[12px] font-semibold uppercase tracking-wider pt-3.5 pb-1.5 px-1"
                style={{ color: "var(--text-2)" }}
              >
                {g.title}
              </div>
              <div className="flex flex-wrap gap-2">
                {g.tags.map((t) => {
                  const on = selected.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!on && selected.length >= MAX_TAGS}
                      onClick={() => toggle(t)}
                      className="px-3.5 py-2 rounded-full text-[13.5px] font-semibold inline-flex items-center gap-1 disabled:opacity-40"
                      style={
                        on
                          ? {
                              background: "var(--accent)",
                              color: "#fff",
                              boxShadow: "0 2px 6px rgba(255,111,61,0.28)",
                            }
                          : {
                              background: "var(--surface)",
                              color: "var(--text)",
                              boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.08)",
                            }
                      }
                    >
                      {!on && (
                        <Sym name="plus" size={11} strokeWidth={2.2} />
                      )}
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Direct entry */}
          <div
            className="text-[12px] font-semibold uppercase tracking-wider pt-4 pb-1.5 px-1"
            style={{ color: "var(--text-2)" }}
          >
            직접 추가
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addDraft();
            }}
            className="rounded-2xl px-3.5 py-3 flex items-center gap-2"
            style={{ background: "var(--surface)" }}
          >
            <Sym name="plus" size={16} strokeWidth={2} />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="새 태그를 입력하세요"
              maxLength={24}
              className="flex-1 bg-transparent outline-none text-[14px]"
            />
            {draft.trim() && (
              <button
                type="submit"
                className="text-[13px] font-semibold"
                style={{ color: "var(--accent)" }}
              >
                추가
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
