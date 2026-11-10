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
 * Material 3 **filled** text field.
 *
 * Anatomy, top to bottom: a `surface-container-highest` container with 4dp top
 * corners, a floating label that sits over the value at rest and shrinks to
 * Body Small above it once the field is focused or filled, the value itself,
 * and a bottom **indicator** — 1dp `outline` normally, 2dp `primary` on focus.
 * Supporting text lives under the container; in the error state the indicator,
 * the label and the supporting text all swap to the `error` role.
 *
 * The float is pure CSS: the input is a `peer` and the label keys off
 * `:placeholder-shown` / `:focus`, so it behaves identically for controlled
 * fields, react-hook-form's uncontrolled `register()` and browser autofill —
 * none of which a JS "has value" flag tracks reliably. A labelled field is
 * therefore always given a placeholder (a single space when the caller has no
 * copy of its own), and the real placeholder stays transparent until focus,
 * which is what M3 specifies anyway.
 *
 * The 2dp focus indicator is drawn as an inset box-shadow on top of the 1dp
 * border rather than by thickening the border, so focusing a field never
 * nudges the layout by a pixel.
 *
 * Mobile: the value is Body Large (16px) at every breakpoint — M3's own size
 * for a text field, and the size that stops iOS Safari zooming the page on
 * focus — and the container clears the 48px touch target at 56px.
 *
 * Label/helper/error are all optional, so existing bare `<Input {...register()} />`
 * call sites keep working unchanged and still render a single element.
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
      placeholder,
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
        // `:placeholder-shown` only matches while a placeholder exists, and it
        // is what drives the floating label — so a labelled field always has
        // one, falling back to a space the user never sees.
        placeholder={label ? (placeholder ?? " ") : placeholder}
        className={clsx(
          "peer min-h-[3.5rem] w-full rounded-t-xs border-b bg-md-surface-container-highest px-4",
          "text-body-lg text-md-on-surface caret-md-primary outline-none",
          "transition-[border-color,box-shadow,background-color] duration-fast ease-standard",
          // Label present: reserve the top band it floats into. Bare: centre.
          label ? "pb-2 pt-6" : "py-4",
          // M3 hides the placeholder behind the resting label and reveals it
          // once the label has floated out of the way.
          label
            ? "placeholder:text-transparent focus:placeholder:text-md-on-surface-variant"
            : "placeholder:text-md-on-surface-variant",
          error
            ? "border-md-error focus:shadow-[inset_0_-1px_0_0_rgb(var(--md-error))]"
            : "border-md-outline focus:border-md-primary focus:shadow-[inset_0_-1px_0_0_rgb(var(--md-primary))]",
          "disabled:cursor-not-allowed disabled:border-md-on-surface/[0.38] disabled:bg-md-on-surface/[0.04] disabled:text-md-on-surface/[0.38]",
          "read-only:bg-md-on-surface/[0.04]",
          Boolean(startAdornment) && "pl-12",
          Boolean(endAdornment) && "pr-12",
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
        {/* `state-layer` gives the container M3's hover tint of the content
            colour, which is why the wrapper carries `text-md-on-surface`. */}
        <div className="state-layer relative rounded-t-xs text-md-on-surface">
          {startAdornment && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center text-md-on-surface-variant"
            >
              {startAdornment}
            </span>
          )}

          {/* The input precedes the label so the label can be a `peer-*` sibling. */}
          {field}

          {label && (
            <label
              htmlFor={inputId}
              className={clsx(
                "pointer-events-none absolute origin-left truncate transition-all duration-fast ease-standard",
                startAdornment ? "left-12" : "left-4",
                endAdornment ? "right-12" : "right-4",
                // Floated — the default, so a filled field needs no extra state.
                "top-2 text-body-sm",
                // Resting: empty and unfocused. `placeholder-shown` sorts
                // before `focus` in Tailwind's variant order, so focus wins.
                "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-body-lg",
                "peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-body-sm",
                error
                  ? "text-md-error"
                  : "text-md-on-surface-variant peer-focus:text-md-primary",
                "peer-disabled:text-md-on-surface/[0.38]"
              )}
            >
              {label}
              {required && (
                <span className="ml-1 text-md-error" aria-hidden>
                  *
                </span>
              )}
            </label>
          )}

          {endAdornment && (
            <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center text-md-on-surface-variant">
              {endAdornment}
            </span>
          )}
        </div>

        {error ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="mt-1 flex items-start gap-1.5 px-4 text-body-sm text-md-error"
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
          <p
            id={`${inputId}-helper`}
            className="mt-1 px-4 text-body-sm text-md-on-surface-variant"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
