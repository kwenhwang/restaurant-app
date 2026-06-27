"use client";

// Lightweight inline 👍 / 👎 voting widget for AI-generated content.
// Optimistic UI + localStorage cache for instant render on revisit.
// Same surface/target = same row; clicking the same thumb again removes it.

import { useEffect, useRef, useState } from "react";
import Sym from "@/components/ui/Sym";
import { haptic } from "@/lib/haptic";

export type FeedbackSurface = "recommend" | "discover" | "review" | "menu" | "insights";

interface Props {
  surface: FeedbackSurface;
  target: string;
  context?: Record<string, unknown>;
  size?: "sm" | "md";
  /** Render against a dark/photo background — uses translucent white tones. */
  tone?: "default" | "light";
}

type Vote = -1 | 0 | 1;

function storageKey(surface: string, target: string) {
  return `feedback:${surface}:${target}`;
}

function loadInitial(surface: string, target: string): Vote {
  try {
    const v = localStorage.getItem(storageKey(surface, target));
    if (v === "1") return 1;
    if (v === "-1") return -1;
  } catch {}
  return 0;
}

function persistLocal(surface: string, target: string, v: Vote) {
  try {
    if (v === 0) localStorage.removeItem(storageKey(surface, target));
    else localStorage.setItem(storageKey(surface, target), String(v));
  } catch {}
}

export default function FeedbackThumbs({
  surface,
  target,
  context,
  size = "sm",
  tone = "default",
}: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [vote, setVote] = useState<Vote>(0);
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const commentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVote(loadInitial(surface, target));
    setHydrated(true);
  }, [surface, target]);

  if (!hydrated) return null;

  function send(nextVote: Vote, nextComment?: string) {
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        surface,
        target_ref: target,
        vote: nextVote,
        prompt_context: context,
        comment: nextComment ?? (vote !== 0 ? comment.trim() || undefined : undefined),
      }),
      keepalive: true,
    }).catch(() => {});
  }

  function clickThumb(newVote: 1 | -1, e: React.MouseEvent) {
    // The host card is often inside a <Link> — don't follow it.
    e.preventDefault();
    e.stopPropagation();
    const toggled = vote === newVote ? 0 : newVote;
    setVote(toggled);
    haptic(toggled === 0 ? "light" : "light");
    persistLocal(surface, target, toggled);
    send(toggled);
    if (toggled === 0) {
      setExpanded(false);
      setComment("");
    }
  }

  function onCommentChange(value: string) {
    setComment(value.slice(0, 500));
    if (commentTimer.current) clearTimeout(commentTimer.current);
    commentTimer.current = setTimeout(() => {
      if (vote !== 0) send(vote, value.trim() || "");
    }, 600);
  }

  const baseColor = tone === "light" ? "rgba(255,255,255,0.7)" : "var(--text-3)";
  const activeColor = tone === "light" ? "white" : "var(--accent)";
  const activeBg =
    tone === "light"
      ? "rgba(255,255,255,0.2)"
      : "var(--accent-soft)";
  const iconSize = size === "md" ? 16 : 13;
  const btnH = size === "md" ? 28 : 24;

  return (
    <div
      className="inline-flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="좋아요"
        aria-pressed={vote === 1}
        onClick={(e) => clickThumb(1, e)}
        className="inline-flex items-center justify-center rounded-full transition-transform active:scale-90"
        style={{
          width: btnH,
          height: btnH,
          color: vote === 1 ? activeColor : baseColor,
          background: vote === 1 ? activeBg : "transparent",
        }}
      >
        <span style={{ fontSize: iconSize }}>👍</span>
      </button>
      <button
        type="button"
        aria-label="별로예요"
        aria-pressed={vote === -1}
        onClick={(e) => clickThumb(-1, e)}
        className="inline-flex items-center justify-center rounded-full transition-transform active:scale-90"
        style={{
          width: btnH,
          height: btnH,
          color: vote === -1 ? activeColor : baseColor,
          background: vote === -1 ? activeBg : "transparent",
        }}
      >
        <span style={{ fontSize: iconSize }}>👎</span>
      </button>
      {vote !== 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="text-[10px] opacity-70 ml-1"
          style={{ color: tone === "light" ? "white" : "var(--text-3)" }}
        >
          {expanded ? "닫기" : "더 자세히"}
        </button>
      )}
      {expanded && (
        <div
          className="absolute z-10 mt-1 rounded-2xl p-3 shadow-lg"
          style={{
            background: "var(--surface)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
            minWidth: 260,
            maxWidth: 320,
          }}
        >
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="어떤 점이 좋았어요/별로였어요? (선택)"
            rows={3}
            className="w-full bg-transparent outline-none text-[13px] resize-none"
            style={{ color: "var(--text)" }}
          />
          <div className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>
            {comment.length}/500 · 자동 저장
          </div>
        </div>
      )}
    </div>
  );
}
