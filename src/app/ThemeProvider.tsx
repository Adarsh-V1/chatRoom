"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_THEME,
  isAppTheme,
  THEME_MAP,
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
  type AppTheme,
} from "@/src/features/theme/theme-options";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  const themeMode = THEME_MAP.get(theme)?.mode ?? "light";
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = themeMode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isAppTheme(stored) ? stored : DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const setTheme = (nextTheme: AppTheme) => {
    setThemeState(nextTheme);
  };

  const cycleTheme = () => {
    setThemeState((currentTheme) => {
      const currentIndex = THEME_OPTIONS.findIndex((themeOption) => themeOption.id === currentTheme);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % THEME_OPTIONS.length : 0;
      return THEME_OPTIONS[nextIndex]?.id ?? DEFAULT_THEME;
    });
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, cycleTheme }),
    [theme]
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
