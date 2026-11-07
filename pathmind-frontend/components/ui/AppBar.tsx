"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/home/ThemeToggle";
import { clsx } from "@/lib/clsx";

interface AppBarAction {
  href: string;
  label: string;
}

interface AppBarProps {
  /** Screen title. Shown on mobile in place of the wordmark so the user
   *  always knows where they are; desktop shows the wordmark plus title. */
  title?: string;
  /** Renders a back affordance on mobile instead of the logo chip. Pass a
   *  href for a known parent, or omit to use browser history. */
  back?: string | boolean;
  /** Desktop-only inline links. On mobile these live in the bottom nav, so
   *  they are deliberately hidden rather than crammed into a 56px bar. */
  actions?: AppBarAction[];
  /** Extra trailing content (export buttons, etc.). */
  children?: ReactNode;
  className?: string;
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The single app bar for every signed-in screen (journey, dashboard,
 * calendar, saved, profile). It replaces four near-identical hand-rolled
 * headers that each crammed three or four 14px text links into a 64px row —
 * targets well under the 48px minimum, overflowing below ~380px.
 *
 * Mobile: back affordance (or logo) + screen title + theme toggle. Primary
 * destinations move to <BottomNav>, which has room for real touch targets.
 * Desktop (md+): wordmark + inline destination links, as before.
 *
 * The bar is fixed and translucent, so it pays back `viewport-fit=cover`
 * with `pt-safe` — the only place top inset is applied on these screens.
 */
export function AppBar({ title, back, actions = [], children, className }: AppBarProps) {
  const router = useRouter();
  const showBack = Boolean(back);

  return (
    <header
      className={clsx(
        "pt-safe fixed inset-x-0 top-0 z-50 border-b border-line/10 bg-card/70 backdrop-blur-2xl backdrop-saturate-150",
        className
      )}
    >
      {/* Hairline lime shine along the top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
      />

      <div className="mx-auto flex h-app-bar max-w-6xl items-center gap-2 px-3 sm:px-6">
        {/* Leading: back on mobile when there's a parent screen, else logo */}
        {showBack ? (
          <>
            {typeof back === "string" ? (
              <Link
                href={back}
                aria-label="Go back"
                className="press -ml-1 flex h-touch w-touch flex-none items-center justify-center rounded-full text-paper transition-colors duration-fast hover:bg-line/10 md:hidden"
              >
                <BackIcon />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back"
                className="press -ml-1 flex h-touch w-touch flex-none items-center justify-center rounded-full text-paper transition-colors duration-fast hover:bg-line/10 md:hidden"
              >
                <BackIcon />
              </button>
            )}
          </>
        ) : null}

        <Link
          href="/"
          aria-label="Vidhyora home"
          className={clsx(
            "group flex min-h-touch flex-none items-center gap-2.5",
            // When a back button is present the logo would be redundant
            // clutter on a 360px bar — desktop still shows it.
            showBack && "hidden md:flex"
          )}
        >
          <span className="logo-chip flex h-9 w-9 items-center justify-center transition-transform duration-base group-hover:scale-110">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vidhyora-logo.png" alt="" width={36} height={36} className="h-9 w-9" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-paper">
            Vidhyora
          </span>
        </Link>

        {/* Screen title — the "where am I" anchor on mobile */}
        {title && (
          <h1
            className={clsx(
              "min-w-0 flex-1 truncate font-display text-base font-semibold tracking-tight text-paper",
              showBack ? "md:hidden" : "hidden"
            )}
          >
            {title}
          </h1>
        )}

        <div className="flex-1" />

        {/* Desktop destinations — mobile uses the bottom nav instead */}
        {actions.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex min-h-touch items-center rounded-sm px-3 text-sm text-subtle transition-colors duration-fast hover:text-accent"
              >
                {a.label}
              </Link>
            ))}
          </nav>
        )}

        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
