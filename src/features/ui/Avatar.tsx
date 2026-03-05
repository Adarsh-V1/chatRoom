import React from "react";
import { cn } from "@/src/lib/utils";

type Props = {
  name: string;
  url?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-8 w-8 rounded-xl",
  md: "h-10 w-10 rounded-2xl",
  lg: "h-14 w-14 rounded-[22px]",
};

export function Avatar({ name, url, size = "md", className }: Props) {
  const initial = (name.trim().slice(0, 1) || "?").toUpperCase();

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden border border-[color:var(--border-1)] bg-[color:rgba(235,242,251,0.9)] shadow-[0_12px_24px_-18px_rgba(15,23,42,0.36)] ring-1 ring-cyan-100/60",
        sizeClasses[size],
        className
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-cyan-100 via-sky-50 to-amber-100 text-xs font-semibold text-slate-700">
          {initial}
        </div>
      )}
    </div>
  );
}
