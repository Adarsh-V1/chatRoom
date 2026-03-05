"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";

type Theme = "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (_theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = "light";
  document.documentElement.style.colorScheme = "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme();
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", "light");
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: "light", setTheme: () => undefined, toggleTheme: () => undefined }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
