"use client";

import React from "react";
import { useTheme } from "@/src/app/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-sm transition theme-chip"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span className="text-sm" aria-hidden="true">
        {isDark ? "moon" : "sun"}
      </span>
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
