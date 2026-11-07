"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { clsx } from "@/lib/clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible label. A placeholder is never a substitute for one — it
   *  disappears the moment the user types. */
  label?: string;
  /** Guidance shown under the field while it's valid. */
  helperText?: string;
  /** Validation message. Wires up aria-invalid + aria-describedby and is
   *  rendered with an icon so the error isn't signalled by colour alone. */
  error?: string;
  /** Marks the field required visually and for assistive tech. */
  required?: boolean;
  /** Leading adornment (icon). Reserves left padding automatically. */
  startAdornment?: ReactNode;
  /** Trailing adornment (clear / reveal). Reserves right padding. */
  endAdornment?: ReactNode;
  wrapperClassName?: string;
}

/**
 * Text field on the semantic token layer.
 *
 * The previous version hardcoded `border-slate-700 bg-surface-900/80
 * text-slate-100`, which rendered as a dark field on the light theme's white
 * canvas. Everything here resolves through `--color-*`, so both themes work.
 *
 * Mobile: the 16px base font-size enforced in globals.css stops iOS Safari
 * zooming the page on focus, and the 48px min-height keeps the field a
 * comfortable touch target.
 *
 * Label/helper/error are all optional, so existing bare `<Input {...register()} />`
 * call sites keep working unchanged.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      required,
      startAdornment,
      endAdornment,
      className,
      wrapperClassName,
      id,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error
      ? `${inputId}-error`
      : helperText
        ? `${inputId}-helper`
        : undefined;

    const field = (
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={clsx(
          "min-h-touch w-full rounded-sm border bg-card/60 px-4 py-3 text-paper outline-none",
          "placeholder:text-muted",
          "transition-colors duration-fast ease-standard",
          "disabled:cursor-not-allowed disabled:bg-line/5 disabled:text-muted",
          "read-only:bg-line/5",
          error
            ? "border-danger/60 focus-visible:border-danger focus-visible:ring-2 focus-visible:ring-danger/25"
            : "border-line/15 focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/25",
          Boolean(startAdornment) && "pl-11",
          Boolean(endAdornment) && "pr-11",
          className
        )}
        {...props}
      />
    );

    // Bare usage — no label/helper/error/adornments — renders just the input
    // so existing layouts aren't wrapped in an extra div.
    if (!label && !helperText && !error && !startAdornment && !endAdornment) {
      return field;
    }

    return (
      <div className={clsx("w-full", wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-subtle"
          >
            {label}
            {required && (
              <span className="ml-1 text-danger" aria-hidden>
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {startAdornment && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center text-muted"
            >
              {startAdornment}
            </span>
          )}
          {field}
          {endAdornment && (
            <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
              {endAdornment}
            </span>
          )}
        </div>

        {error ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="mt-2 flex items-start gap-1.5 text-xs text-danger"
          >
            {/* Icon as well as colour — status is never colour alone */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              className="mt-px flex-none"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M12 7.5v5M12 16h.01"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="mt-2 text-xs text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
