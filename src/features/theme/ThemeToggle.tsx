"use client";

import { Check, ChevronDown, Palette } from "lucide-react";
import { useTheme } from "@/src/app/ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { THEME_MAP, THEME_OPTIONS } from "@/src/features/theme/theme-options";

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
};

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const activeTheme = THEME_MAP.get(theme) ?? THEME_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "icon" : "default"}
          className={cn("rounded-full", !compact && "min-w-44 justify-between", className)}
          aria-label="Change color theme"
        >
          <span className="flex items-center gap-2">
            <Palette className="h-4 w-4" aria-hidden="true" />
            {compact ? null : <span className="truncate">{activeTheme.label}</span>}
          </span>
          {compact ? null : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[21rem]">
        <DropdownMenuLabel>Choose theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="grid gap-1">
          {THEME_OPTIONS.map((option) => {
            const isActive = option.id === theme;
            return (
              <DropdownMenuItem
                key={option.id}
                onSelect={() => setTheme(option.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl p-3",
                  isActive && "bg-[color:var(--surface-3)]"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {option.swatches.map((swatch) => (
                    <span
                      key={`${option.id}-${swatch}`}
                      className="h-4 w-4 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: swatch }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-[color:var(--text-1)]">{option.label}</span>
                    <span className="rounded-full border border-[color:var(--border-1)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-3)]">
                      {option.mode}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs leading-5 text-[color:var(--text-3)]">{option.description}</div>
                </div>
                {isActive ? <Check className="h-4 w-4 shrink-0 text-[color:var(--accent-text)]" aria-hidden="true" /> : null}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
