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

function ActionButton({ action, variant }: { action: Action; variant: "primary" | "secondary" }) {
  const cls = clsx(
    "press inline-flex min-h-touch items-center justify-center rounded-sm px-6 text-sm transition-colors duration-fast",
    variant === "primary"
      ? "bg-accent font-bold tracking-tight text-on-accent shadow-e2 hover:bg-accent-hover"
      : "border border-line/15 font-semibold text-subtle hover:border-accent/50 hover:text-accent"
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
        "mx-auto flex w-full max-w-md flex-col items-center px-6 py-16 text-center",
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
            tone === "error" ? "bg-danger/12 text-danger" : "bg-accent/12 text-accent-text"
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

      <h2 className="mt-6 font-display text-xl font-semibold tracking-tight text-paper">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>

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
