import * as React from "react";
import { cn } from "@/src/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-cyan-300/80 bg-cyan-100/80 text-cyan-900",
  secondary: "border-[color:var(--border-1)] bg-[color:rgba(217,228,243,0.92)] text-[color:var(--text-2)]",
  outline: "border-[color:var(--border-1)] bg-[color:rgba(240,245,252,0.7)] text-[color:var(--text-2)]",
  success: "border-emerald-300/80 bg-emerald-100/80 text-emerald-900",
  warning: "border-amber-300/80 bg-amber-100/82 text-amber-900",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: BadgeVariant }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
