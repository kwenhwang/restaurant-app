"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  restaurantId: string;
  initial: boolean;
  size?: "sm" | "lg";
}

export default function FavoriteButton({ restaurantId, initial, size = "lg" }: Props) {
  const [favorite, setFavorite] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !favorite;
    setFavorite(next); // optimistic
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("restaurants")
        .update({ is_favorite: next })
        .eq("id", restaurantId);
      if (error) {
        setFavorite(!next); // rollback
        return;
      }
      router.refresh();
    });
  }

  const dim = size === "lg" ? 44 : 28;
  const icon = size === "lg" ? 20 : 14;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      aria-pressed={favorite}
      disabled={pending}
      className="rounded-full flex items-center justify-center transition-transform active:scale-90"
      style={{
        width: dim,
        height: dim,
        background: favorite ? "var(--accent)" : "var(--accent-soft)",
        color: favorite ? "white" : "var(--accent)",
      }}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill={favorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
