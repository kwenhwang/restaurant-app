import { ReactNode } from "react";

/**
 * Pill chip for category filter rows.
 */
export function Chip({
  active = false,
  children,
}: { active?: boolean; children: ReactNode }) {
  return (
    <span
      className="shrink-0 px-3.5 py-2 rounded-full text-[14px] font-semibold"
      style={
        active
          ? { background: "var(--text)", color: "#fff" }
          : {
              background: "#fff",
              color: "var(--text)",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(0,0,0,0.06)",
            }
      }
    >
      {children}
    </span>
  );
}
