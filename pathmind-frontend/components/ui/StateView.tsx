"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Illustration, type IllustrationName } from "@/components/ui/Illustration";
import { clsx } from "@/lib/clsx";

interface Action {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface StateViewProps {
  tone?: "empty" | "error";
  title: string;
  /** Why the user is seeing this, and what to do about it. "No data" on its
   *  own is not an acceptable empty state. */
  description: string;
  illustration?: IllustrationName;
  primary?: Action;
  secondary?: Action;
  children?: ReactNode;
  className?: string;
}

/**
 * The recovery actions borrow M3's filled/outlined pair, but can't delegate to
 * `md/Button`: an action with `href` has to render a real `<a>` (CLAUDE.md §6
 * — `button` for actions, `a` for navigation), and `MdButton` is a `<button>`.
 * The classes are therefore kept deliberately identical to it, `state-layer`
 * and all, so the two render the same control.
 */
function ActionButton({ action, variant }: { action: Action; variant: "primary" | "secondary" }) {
  const cls = clsx(
    "state-layer press inline-flex min-h-touch select-none items-center justify-center rounded-full px-6 text-label-lg font-medium",
    "transition-[background-color,border-color] duration-fast ease-standard",
    variant === "primary"
      ? "bg-md-primary text-md-on-primary"
      : "border border-md-outline text-md-primary"
  );

  if (action.href) {
    return (
      <Link href={action.href} className={cls}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={cls}>
      {action.label}
    </button>
  );
}

/**
 * Shared empty and error state.
 *
 * Every collection screen in the app now routes its "nothing here" and
 * "something broke" paths through this, so the explanation, the illustration
 * and the recovery action are consistent instead of being re-improvised per
 * screen. Error copy is written for the user — raw backend messages and
 * status codes never reach this component.
 *
 * The fallback mark uses an `*-container` / `on-*-container` role pair rather
 * than a tint of the base role, and carries a different glyph per tone, so the
 * difference between "nothing here yet" and "this broke" survives being read
 * in greyscale.
 */
export function StateView({
  tone = "empty",
  title,
  description,
  illustration,
  primary,
  secondary,
  children,
  className,
}: StateViewProps) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={clsx(
        "mx-auto flex w-full max-w-md flex-col items-center px-4 py-16 text-center sm:px-6",
        className
      )}
    >
      {illustration ? (
        <Illustration
          name={illustration}
          className="h-40 w-56 sm:h-48 sm:w-72"
          imgClassName="object-contain p-2"
          glow={tone === "empty"}
        />
      ) : (
        <span
          aria-hidden
          className={clsx(
            "flex h-14 w-14 items-center justify-center rounded-full",
            tone === "error"
              ? "bg-md-error-container text-md-on-error-container"
              : "bg-md-primary-container text-md-on-primary-container"
          )}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path
              d={tone === "error" ? "M12 7.5v5M12 16h.01" : "M12 16v-5M12 8h.01"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}

      <h2 className="mt-6 text-headline-sm text-md-on-surface">{title}</h2>
      <p className="mt-2 text-body-md text-md-on-surface-variant">{description}</p>

      {(primary || secondary) && (
        <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {primary && <ActionButton action={primary} variant="primary" />}
          {secondary && <ActionButton action={secondary} variant="secondary" />}
        </div>
      )}

      {children}
    </div>
  );
}
