import { Link2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

type BrandLogoProps = {
  className?: string;
  mode?: "full" | "mark";
  size?: "sm" | "md";
  tagline?: string;
};

const markSizeClasses = {
  sm: "h-9 w-9 rounded-xl",
  md: "h-10 w-10 rounded-2xl",
} as const;

const iconSizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
} as const;

export function BrandLogo({
  className,
  mode = "full",
  size = "md",
  tagline = "Connected workspace",
}: BrandLogoProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden border border-emerald-300/55 shadow-[0_16px_30px_-22px_rgba(6,95,70,0.48)]",
          markSizeClasses[size]
        )}
      >
        <div className="absolute inset-0 bg-linear-to-br from-teal-100 via-cyan-50 to-amber-100" />
        <div className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-amber-200/65 blur-sm" />
        <Link2 className={cn("relative text-emerald-900", iconSizeClasses[size])} aria-hidden="true" />
      </div>

      {mode === "full" ? (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-text)]">{tagline}</div>
          <div className="truncate text-lg font-semibold tracking-tight text-[color:var(--text-1)]">
            Convo<span className="text-emerald-700">Link</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
