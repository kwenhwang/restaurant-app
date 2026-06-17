"use client";

import { useState, useTransition } from "react";
import Sym from "@/components/ui/Sym";

interface Props {
  followeeId: string;
  initial: boolean;
  /** If true (default), shows as a primary button. Render compact ghost
   * style for use inside lists / cards. */
  variant?: "primary" | "ghost";
}

export default function FollowButton({ followeeId, initial, variant = "primary" }: Props) {
  const [following, setFollowing] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const next = !following;
    setFollowing(next); // optimistic
    startTransition(async () => {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followee_id: followeeId, on: next }),
      });
      if (!res.ok) setFollowing(!next); // rollback
    });
  }

  const followingStyle =
    variant === "primary"
      ? {
          background: "var(--surface)",
          color: "var(--text)",
          boxShadow: "inset 0 0 0 1px var(--separator)",
        }
      : { background: "var(--bg)", color: "var(--text-2)" };

  const notFollowingStyle =
    variant === "primary"
      ? { background: "var(--accent)", color: "white" }
      : { background: "var(--accent-soft)", color: "var(--accent-press)" };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="h-9 px-4 rounded-full text-[13px] font-bold inline-flex items-center gap-1 transition-transform active:scale-95 disabled:opacity-50"
      style={following ? followingStyle : notFollowingStyle}
    >
      {following ? (
        <>
          <Sym name="checkmark" size={12} strokeWidth={2.4} />
          팔로잉
        </>
      ) : (
        <>
          <Sym name="plus" size={12} strokeWidth={2.4} />
          팔로우
        </>
      )}
    </button>
  );
}
