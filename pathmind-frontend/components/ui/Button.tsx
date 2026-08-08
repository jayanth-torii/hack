"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

type Variant = "primary" | "secondary" | "ghost" | "accent";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20 disabled:bg-slate-600",
  secondary: "bg-surface-800 text-slate-100 hover:bg-surface-800/70 border border-slate-700",
  ghost: "bg-transparent text-slate-300 hover:text-white hover:bg-white/5",
  // Acjon signature lime CTA — see templates/acjon (_theme.scss tp-btn-green).
  accent: "bg-accent text-on-accent font-bold tracking-tight hover:bg-accent-hover shadow-lg shadow-accent/25 disabled:bg-slate-600",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {isLoading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
