// components/ui/EmptyState.tsx — v3 (F2)
// Unified empty-state illustration used across map / visits / profile / search.
// Tilted stacked tiles + emoji, serif title, body, optional CTA.

import Link from "next/link";
import { ReactNode } from "react";
import Sym from "@/components/ui/Sym";

export default function EmptyState({
  tone = "var(--accent)",
  emoji,
  icon,
  title,
  body,
  cta,
  ctaHref = "/capture",
  ctaIcon = "camera",
}: {
  tone?: string;
  emoji?: string;
  icon?: React.ComponentProps<typeof Sym>["name"];
  title: string;
  body: ReactNode;
  cta?: string;
  ctaHref?: string;
  ctaIcon?: React.ComponentProps<typeof Sym>["name"];
}) {
  return (
    <div className="flex flex-col items-center text-center px-9 py-16 animate-fade-up">
      <div className="relative" style={{ width: 116, height: 116, marginBottom: 22 }}>
        <div
          className="absolute inset-0"
          style={{ borderRadius: 36, background: `color-mix(in srgb, ${tone} 14%, transparent)`, transform: "rotate(-8deg)" }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ borderRadius: 36, background: "var(--surface)", boxShadow: "var(--shadow-2)", transform: "rotate(5deg)" }}
        >
          {emoji ? (
            <span style={{ fontSize: 52 }}>{emoji}</span>
          ) : (
            icon && <span style={{ color: tone }}><Sym name={icon} size={46} /></span>
          )}
        </div>
      </div>
      <h2 className="font-display text-[23px] font-extrabold">{title}</h2>
      <p className="mt-2.5 text-[14.5px] leading-relaxed" style={{ color: "var(--text-2)", maxWidth: 280 }}>
        {body}
      </p>
      {cta && (
        <Link
          href={ctaHref}
          className="mt-[22px] inline-flex items-center gap-2 h-12 px-6 rounded-[15px] text-white text-[15px] font-extrabold transition-transform active:scale-[0.97]"
          style={{ background: tone, boxShadow: `0 8px 20px color-mix(in srgb, ${tone} 32%, transparent)` }}
        >
          <Sym name={ctaIcon} size={18} strokeWidth={2} />
          {cta}
        </Link>
      )}
    </div>
  );
}
