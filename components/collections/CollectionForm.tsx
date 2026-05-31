"use client";

// Client form for creating / editing collections. The server action wants a
// plain FormData with field names exactly as we set them; React's automatic
// progressive-enhancement form-action wiring on Server Components prefixes
// field names (`_1_name`), which breaks `formData.get("name")` reads in the
// action. By building FormData manually here we get clean field names.

import { useState, useTransition } from "react";
import Link from "next/link";

interface Props {
  mode: "create" | "edit";
  action: (formData: FormData) => Promise<void>;
  initial?: {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean;
  };
  cancelHref: string;
}

export default function CollectionForm({ mode, action, initial, cancelHref }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        if (initial?.id) fd.append("id", initial.id);
        fd.append("name", name.trim());
        if (description.trim()) fd.append("description", description.trim());
        if (isPublic) fd.append("is_public", "on");
        await action(fd);
      } catch (e) {
        // redirect() throws a special signal — Next.js catches it at the
        // boundary, but in some setups it bubbles to the caller. Don't
        // mask navigation as an error.
        const msg = e instanceof Error ? e.message : "";
        if (/NEXT_REDIRECT|next-redirect|redirect/.test(msg)) throw e;
        setError(msg || "저장에 실패했어요");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="px-[18px] space-y-4 mt-2">
      <div
        className="p-4 rounded-2xl space-y-3"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
      >
        <label className="block">
          <span
            className="text-[12px] font-bold uppercase tracking-wider"
            style={{ color: "var(--text-2)" }}
          >
            이름
          </span>
          <input
            type="text"
            name="name"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 강남 데이트 코스"
            className="mt-1 w-full bg-transparent border-0 outline-none text-[18px] font-display font-bold"
          />
        </label>
        <label className="block">
          <span
            className="text-[12px] font-bold uppercase tracking-wider"
            style={{ color: "var(--text-2)" }}
          >
            설명 {mode === "create" ? "(선택)" : ""}
          </span>
          <textarea
            name="description"
            maxLength={280}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이 리스트를 한 줄로 소개해주세요"
            className="mt-1 w-full bg-transparent border-0 outline-none text-[15px] resize-none"
          />
        </label>
        <label className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            name="is_public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-[14px]">공개 리스트 (링크로 공유 가능)</span>
        </label>
      </div>

      {error && (
        <p className="text-[13px] px-1" style={{ color: "#D14343" }}>
          ⚠️ {error}
        </p>
      )}

      <div className="flex gap-2">
        <Link
          href={cancelHref}
          className="flex-1 h-12 rounded-full text-[15px] font-bold flex items-center justify-center"
          style={{ background: "var(--surface)", color: "var(--text)" }}
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="flex-1 h-12 rounded-full text-[15px] font-bold text-white transition-opacity"
          style={{
            background: "var(--accent)",
            opacity: pending || !name.trim() ? 0.5 : 1,
          }}
        >
          {pending ? "저장 중…" : mode === "create" ? "만들기" : "저장"}
        </button>
      </div>
    </form>
  );
}
