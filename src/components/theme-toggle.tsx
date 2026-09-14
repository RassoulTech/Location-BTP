"use client";

import { useEffect, useState } from "react";

/** Bascule clair / sombre, memorisee dans le navigateur. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("btp-theme");
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
        document.documentElement.dataset.theme = saved;
      }
    } catch { /* stockage indisponible : on reste sur le theme systeme */ }
  }, []);

  const toggle = () => {
    const current =
      theme ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("btp-theme", next); } catch { /* sans incidence */ }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Changer de theme"
      className="inline-flex h-9 w-9 items-center justify-center border border-rule text-ink-2 hover:bg-surface-2"
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
      </svg>
    </button>
  );
}
