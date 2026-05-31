import { ReactNode } from "react";

/**
 * Large title header — v3 editorial.
 * Serif display title (Noto Serif KR via .font-display), heavier weight,
 * larger scale. Same props as v2.
 */
export function LargeTitle({
  eyebrow,
  title,
  meta,
  trailing,
}: {
  eyebrow?: ReactNode;
  title: string;
  meta?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between px-[18px] pt-2 pb-3">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[13px] font-bold" style={{ color: "var(--text-2)" }}>
            {eyebrow}
          </div>
        )}
        <h1
          className="font-display text-[38px] font-black leading-[1.02]"
          style={{ letterSpacing: "-1px" }}
        >
          {title}
        </h1>
        {meta && (
          <div className="text-[13px] mt-0.5 tabular-nums" style={{ color: "var(--text-2)" }}>
            {meta}
          </div>
        )}
      </div>
      {trailing}
    </header>
  );
}
