"use client";

export type AppTheme = "ocean-light" | "sand-light" | "mint-light" | "midnight-dark" | "graphite-dark";
export type ThemeMode = "light" | "dark";

export type ThemeOption = {
  id: AppTheme;
  label: string;
  mode: ThemeMode;
  description: string;
  swatches: [string, string, string];
};

export const THEME_STORAGE_KEY = "convolink-theme";
export const DEFAULT_THEME: AppTheme = "ocean-light";

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "ocean-light",
    label: "Ocean Glass",
    mode: "light",
    description: "Bright cyan and seafoam surfaces for daytime work.",
    swatches: ["#0f766e", "#0ea5e9", "#f8fafc"],
  },
  {
    id: "sand-light",
    label: "Sandstone",
    mode: "light",
    description: "Warm neutrals with amber highlights and softer contrast.",
    swatches: ["#c2410c", "#f59e0b", "#fff7ed"],
  },
  {
    id: "mint-light",
    label: "Mint Ledger",
    mode: "light",
    description: "Fresh green tints with crisp blue accents.",
    swatches: ["#15803d", "#0891b2", "#f0fdf4"],
  },
  {
    id: "midnight-dark",
    label: "Midnight Signal",
    mode: "dark",
    description: "Deep navy panels with electric cyan contrast.",
    swatches: ["#0f172a", "#06b6d4", "#22c55e"],
  },
  {
    id: "graphite-dark",
    label: "Graphite Ember",
    mode: "dark",
    description: "Muted graphite surfaces with ember-orange highlights.",
    swatches: ["#18181b", "#f97316", "#facc15"],
  },
];

export const THEME_MAP = new Map(THEME_OPTIONS.map((theme) => [theme.id, theme] as const));

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return THEME_MAP.has((value ?? "") as AppTheme);
}
