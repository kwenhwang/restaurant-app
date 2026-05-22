// components/restaurants/TagList.tsx
// Renders tag chips + "add" trigger. Opens TagPicker sheet when tapped.

"use client";

import { useState, useTransition } from "react";
import TagPicker from "./TagPicker";
import { setTags } from "./tag-actions";
import Sym from "@/components/ui/Sym";

interface Props {
  restaurantId: string;
  initial: string[];
}

export default function TagList({ restaurantId, initial }: Props) {
  const [tags, setLocalTags] = useState(initial);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function commit(next: string[]) {
    setLocalTags(next); // optimistic
    startTransition(async () => {
      try {
        await setTags(restaurantId, next);
      } catch (e) {
        setLocalTags(initial); // rollback
        alert("태그 저장 실패");
      }
    });
  }

  return (
    <>
      <div className="flex gap-1.5 flex-wrap">
        {tags.map((t) => (
          <span
            key={t}
            className="px-3 py-1 rounded-full text-[12.5px] font-semibold"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            #{t}
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-2.5 py-1 rounded-full text-[12.5px] font-semibold flex items-center gap-1 transition-transform active:scale-95"
          style={{
            background: "var(--surface)",
            color: "var(--text-2)",
            boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.08)",
          }}
        >
          <Sym name="plus" size={11} strokeWidth={2.4} />
          {tags.length === 0 ? "분위기 태그 추가" : "태그"}
        </button>
      </div>

      {open && (
        <TagPicker
          initial={tags}
          onClose={() => setOpen(false)}
          onSave={(next) => {
            commit(next);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
