"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

const LABEL: Record<Theme, string> = {
  system: "시스템",
  light: "라이트",
  dark: "다크",
};

function apply(theme: Theme) {
  const html = document.documentElement;
  if (theme === "system") {
    html.removeAttribute("data-theme");
  } else {
    html.setAttribute("data-theme", theme);
  }
  // Update meta theme-color so iOS PWA status bar matches
  const effective =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", effective === "dark" ? "#0C0B0A" : "#FF6F3D");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) || "system";
    setTheme(saved);
    apply(saved);
  }, []);

  function change(next: Theme) {
    setTheme(next);
    localStorage.setItem("theme", next);
    apply(next);
  }

  return (
    <div
      className="flex rounded-2xl p-1 gap-1"
      style={{ background: "var(--bg)" }}
      role="radiogroup"
      aria-label="테마"
    >
      {(Object.keys(LABEL) as Theme[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => change(t)}
          role="radio"
          aria-checked={theme === t}
          className="flex-1 h-9 rounded-xl text-[13px] font-semibold transition-colors"
          style={{
            background: theme === t ? "var(--surface)" : "transparent",
            color: theme === t ? "var(--text)" : "var(--text-2)",
            boxShadow:
              theme === t ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
          }}
        >
          {LABEL[t]}
        </button>
      ))}
    </div>
  );
}
