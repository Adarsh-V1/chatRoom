import * as React from "react";
import { cn } from "@/src/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
        <input
          ref={ref}
          className={cn(
          "theme-input flex h-11 w-full rounded-xl border px-3 py-2 text-sm font-medium text-[color:var(--text-1)] shadow-[0_10px_26px_-22px_rgba(15,23,42,0.36)] outline-none transition-all duration-200 placeholder:text-[color:var(--text-3)] focus:border-[color:var(--brand-border)] focus:bg-[color:var(--input-focus)] focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
