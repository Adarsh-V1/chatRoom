import * as React from "react";
import { cn } from "@/src/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "border border-cyan-500/80 bg-linear-to-r from-cyan-600 via-sky-600 to-teal-600 text-white shadow-[0_18px_36px_-18px_rgba(8,145,178,0.58)] hover:from-cyan-500 hover:via-sky-500 hover:to-teal-500 hover:border-cyan-400/80",
  secondary:
    "border border-[color:var(--border-1)] bg-[color:var(--surface-2)] text-[color:var(--text-1)] shadow-[0_12px_28px_-22px_rgba(15,23,42,0.4)] hover:bg-[color:var(--surface-1)]",
  outline:
    "border border-[color:var(--border-1)] bg-[color:rgba(239,245,252,0.72)] text-[color:var(--text-2)] shadow-[0_12px_28px_-22px_rgba(15,23,42,0.36)] hover:border-[color:var(--border-2)] hover:bg-[color:rgba(244,248,253,0.92)]",
  ghost:
    "border border-transparent bg-transparent text-[color:var(--text-2)] hover:bg-[color:rgba(219,231,246,0.7)] hover:text-[color:var(--text-1)]",
  destructive:
    "border border-rose-300/80 bg-rose-50/90 text-rose-800 shadow-[0_12px_28px_-20px_rgba(225,29,72,0.32)] hover:bg-rose-100/95 hover:border-rose-400/80",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-8 rounded-lg px-3 text-xs",
  lg: "h-11 rounded-xl px-5 text-sm",
  icon: "h-10 w-10 rounded-xl p-0",
};

export const buttonClassName = (
  variant: ButtonVariant = "default",
  size: ButtonSize = "default",
  className?: string
) =>
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold tracking-[0.01em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", type = "button", ...props },
  ref
) {
  return <button ref={ref} type={type} className={buttonClassName(variant, size, className)} {...props} />;
});
