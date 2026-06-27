"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { haptic } from "@/lib/haptic";

interface Props {
  restaurantId: string;
  initial: boolean;
  size?: "sm" | "lg";
  /** "chip" = soft circular button (default) · "glass" = white-on-photo overlay */
  variant?: "chip" | "glass";
}

/**
 * Favorite heart — v3.
 * Same optimistic-update + Supabase logic as v2. Adds a spring "pop" + ring
 * burst on activation (E1) and a `glass` variant for photo overlays.
 */
export default function FavoriteButton({
  restaurantId,
  initial,
  size = "lg",
  variant = "chip",
}: Props) {
  const [favorite, setFavorite] = useState(initial);
  const [burst, setBurst] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !favorite;
    setFavorite(next); // optimistic
    haptic("light");
    if (next) {
      setBurst(true);
      setTimeout(() => setBurst(false), 540);
    }
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

  const dim = size === "lg" ? 44 : 30;
  const icon = size === "lg" ? 20 : 15;

  const glass = variant === "glass";
  const bg = glass
    ? "rgba(20,16,12,0.34)"
    : favorite
      ? "var(--accent)"
      : "var(--accent-soft)";
  const fg = glass
    ? "#fff"
    : favorite
      ? "white"
      : "var(--accent)";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      aria-pressed={favorite}
      disabled={pending}
      className="relative rounded-full flex items-center justify-center transition-transform active:scale-90"
      style={{
        width: dim,
        height: dim,
        background: bg,
        color: favorite && glass ? "var(--accent)" : fg,
        backdropFilter: glass ? "blur(8px)" : undefined,
      }}
    >
      {burst && (
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: icon + 4,
            height: icon + 4,
            border: "2px solid var(--accent)",
            animation: "heart-burst .54s ease-out forwards",
          }}
        />
      )}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill={favorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animation: favorite ? "heart-pop .42s ease-out" : undefined }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
