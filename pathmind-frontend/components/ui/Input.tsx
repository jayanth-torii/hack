import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-xl border border-slate-700 bg-surface-900/80 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
