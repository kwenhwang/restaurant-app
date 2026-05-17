import { ReactNode } from "react";

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
    <header className="flex items-end justify-between px-5 pt-2 pb-3">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
            {eyebrow}
          </div>
        )}
        <h1 className="text-[34px] font-extrabold leading-tight" style={{ letterSpacing: "-0.8px" }}>
          {title}
        </h1>
        {meta && (
          <div className="text-[13px] mt-0.5" style={{ color: "var(--text-2)" }}>
            {meta}
          </div>
        )}
      </div>
      {trailing}
    </header>
  );
}
