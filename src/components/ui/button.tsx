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
    "border bg-linear-to-r from-[color:var(--brand-1)] via-[color:var(--brand-2)] to-[color:var(--brand-3)] text-[color:var(--brand-contrast)] shadow-[var(--brand-shadow)] border-[color:var(--brand-border)] hover:brightness-110",
  secondary:
    "border border-[color:var(--border-1)] bg-[color:var(--button-secondary-bg)] text-[color:var(--text-1)] shadow-[0_12px_28px_-22px_rgba(15,23,42,0.4)] hover:bg-[color:var(--surface-1)]",
  outline:
    "border border-[color:var(--border-1)] bg-[color:var(--button-outline-bg)] text-[color:var(--text-2)] shadow-[0_12px_28px_-22px_rgba(15,23,42,0.36)] hover:border-[color:var(--border-2)] hover:bg-[color:var(--surface-1)]",
  ghost:
    "border border-transparent bg-transparent text-[color:var(--text-2)] hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-1)]",
  destructive:
    "border bg-[color:var(--danger-soft)] text-[color:var(--danger-text)] shadow-[0_12px_28px_-20px_rgba(225,29,72,0.22)] border-[color:var(--danger-border)] hover:brightness-105",
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
