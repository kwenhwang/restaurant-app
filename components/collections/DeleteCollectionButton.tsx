"use client";

import { useTransition } from "react";

interface Props {
  action: () => Promise<void>;
}

export default function DeleteCollectionButton({ action }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (pending) return;
    if (!window.confirm("이 컬렉션을 삭제할까요?")) return;
    startTransition(() => action());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="w-full h-11 rounded-full text-[13px] font-bold"
      style={{ background: "var(--surface)", color: "#D14343" }}
    >
      {pending ? "삭제 중…" : "컬렉션 삭제"}
    </button>
  );
}
