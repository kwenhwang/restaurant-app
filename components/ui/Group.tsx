import { Children, ReactNode } from "react";
import Sym from "./Sym";

export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div
      className="text-[12px] font-semibold uppercase tracking-[0.6px] px-1 pt-3.5 pb-1.5"
      style={{ color: "var(--text-2)" }}
    >
      {children}
    </div>
  );
}

/**
 * Inset-grouped list card. Adds 0.5px separators between rows.
 */
export function Group({ children }: { children: ReactNode }) {
  const arr = Children.toArray(children);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)" }}
    >
      {arr.map((c, i) => (
        <div key={i} className="relative">
          {c}
          {i < arr.length - 1 && (
            <div
              className="absolute right-0 bottom-0 h-[0.5px]"
              style={{ left: 52, background: "var(--separator)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

import type { ComponentProps } from "react";

export function ListRow({
  icon,
  label,
  detail,
  trailing,
}: {
  icon?: ComponentProps<typeof Sym>["name"];
  label: ReactNode;
  detail?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      {icon && (
        <div
          className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Sym name={icon} size={16} />
        </div>
      )}
      <div className="flex-1 text-[15px] min-w-0">{label}</div>
      {detail && (
        <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
          {detail}
        </div>
      )}
      {trailing}
    </div>
  );
}
