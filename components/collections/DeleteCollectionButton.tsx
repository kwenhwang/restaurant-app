"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  action: () => Promise<void>;
  redirectTo?: string;
}

export default function DeleteCollectionButton({ action, redirectTo = "/collections" }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (pending) return;
    if (!window.confirm("이 컬렉션을 삭제할까요?")) return;
    startTransition(async () => {
      await action();
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="w-full h-11 rounded-full text-[13px] font-bold"
      style={{ background: "var(--surface)", color: "var(--error)" }}
    >
      {pending ? "삭제 중…" : "컬렉션 삭제"}
    </button>
  );
}
