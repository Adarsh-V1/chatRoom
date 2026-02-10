import React from "react";

type Props = {
  name: string;
  url?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-xl",
  lg: "h-12 w-12 rounded-2xl",
};

export function Avatar({ name, url, size = "md", className }: Props) {
  const initial = (name.trim().slice(0, 1) || "?").toUpperCase();

  return (
    <div
      className={
        "shrink-0 overflow-hidden border theme-panel-strong " +
        sizeClasses[size] +
        (className ? ` ${className}` : "")
      }
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-bold theme-muted">
          {initial}
        </div>
      )}
    </div>
  );
}
