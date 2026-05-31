"use client";

import { useState } from "react";
import Sym from "@/components/ui/Sym";

interface Props {
  token: string;
}

export default function CollectionShareBar({ token }: Props) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/c/${token}`
    : `/c/${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "맛집 컬렉션",
          url,
        });
        return;
      } catch {}
    }
    copy();
  }

  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-2"
      style={{ background: "var(--accent-soft)" }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--accent-press)" }}>
          공유 링크
        </div>
        <div
          className="text-[13px] font-mono truncate"
          style={{ color: "var(--text)" }}
          title={url}
        >
          {url.replace(/^https?:\/\//, "")}
        </div>
      </div>
      <button
        type="button"
        onClick={copy}
        className="h-9 px-3 rounded-full inline-flex items-center gap-1 text-[12px] font-bold"
        style={{ background: "var(--surface)", color: "var(--text)" }}
      >
        <Sym name="square.and.pencil" size={12} />
        {copied ? "복사됨" : "복사"}
      </button>
      <button
        type="button"
        onClick={share}
        className="h-9 px-3 rounded-full inline-flex items-center gap-1 text-[12px] font-bold text-white"
        style={{ background: "var(--accent)" }}
      >
        <Sym name="square.and.arrow.up" size={12} />
        공유
      </button>
    </div>
  );
}
