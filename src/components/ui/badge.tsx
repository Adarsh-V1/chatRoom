import * as React from "react";
import { cn } from "@/src/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-[color:var(--brand-border)] bg-[color:var(--surface-3)] text-[color:var(--accent-text)]",
  secondary: "border-[color:var(--border-1)] bg-[color:var(--surface-3)] text-[color:var(--text-2)]",
  outline: "border-[color:var(--border-1)] bg-[color:var(--button-outline-bg)] text-[color:var(--text-2)]",
  success: "border-[color:var(--success-border)] bg-[color:var(--success-soft)] text-[color:var(--success-text)]",
  warning: "border-[color:var(--warning-border)] bg-[color:var(--warning-soft)] text-[color:var(--warning-text)]",
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
