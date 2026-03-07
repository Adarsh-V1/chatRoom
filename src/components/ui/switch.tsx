import * as React from "react";
import { cn } from "@/src/lib/utils";

interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2",
        checked
          ? "border-[color:var(--brand-border)] bg-linear-to-r from-[color:var(--brand-1)] via-[color:var(--brand-2)] to-[color:var(--brand-3)] shadow-[var(--brand-shadow)]"
          : "border-[color:var(--border-1)] bg-[color:var(--surface-4)]",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "block h-5 w-5 rounded-full bg-[color:rgba(248,250,253,0.98)] shadow-[0_8px_18px_-12px_rgba(15,23,42,0.5)] transition-transform duration-200 ease-out",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
});
