"use client";

import { useState, useTransition } from "react";
import Sym from "@/components/ui/Sym";
import { removeFromCollection } from "@/app/(main)/collections/actions";

interface Props {
  collectionId: string;
  restaurantId: string;
}

export default function CollectionItemActions({ collectionId, restaurantId }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleRemove() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 2000);
      return;
    }
    startTransition(() => removeFromCollection(collectionId, restaurantId));
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={pending}
      className="absolute top-3 right-3 h-8 px-3 rounded-full text-[11px] font-bold inline-flex items-center gap-1"
      style={{
        background: confirming ? "var(--accent)" : "rgba(0,0,0,0.55)",
        color: "white",
        backdropFilter: "blur(6px)",
      }}
      aria-label="컬렉션에서 빼기"
    >
      <Sym name="trash" size={12} strokeWidth={2.2} />
      {confirming ? "한 번 더 탭" : "빼기"}
    </button>
  );
}
