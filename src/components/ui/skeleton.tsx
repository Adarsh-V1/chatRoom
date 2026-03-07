import * as React from "react";
import { cn } from "@/src/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "loading-shimmer rounded-2xl bg-[color:rgba(148,163,184,0.14)]",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
