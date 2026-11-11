"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/home/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
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
   *  they are deliberately hidden rather than crammed into a 64px bar. */
  actions?: AppBarAction[];
  /** Extra trailing content (export buttons, etc.). */
  children?: ReactNode;
  className?: string;
}

/** M3's leading navigation icon — the 24px/1.8-stroke arrow the full-screen
 *  dialog uses, so "go back" looks identical wherever it appears. */
function ArrowBackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19 12H5m0 0 6.5-6.5M5 12l6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** M3's shield glyph for the admin entry point, on the same 24px/1.8 grid. */
function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.2 5 6v5.6c0 4 2.9 7.6 7 8.8 4.1-1.2 7-4.8 7-8.8V6l-7-2.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m9.2 12 2 2 3.6-3.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The admin area's one entry point, rendered for admins on every signed-in
 * screen rather than buried on one of them.
 *
 * `user.role` is a **UI hint only** — it decides whether a link is drawn, not
 * whether anything can be done. Every `/admin` endpoint re-reads the role from
 * the database, and `/admin` itself confirms authorization with its first
 * request, so a tampered client store yields an explanation screen rather than
 * access.
 */
function AdminLink() {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== "admin") return null;

  return (
    <Link
      href="/admin"
      aria-label="Admin dashboard"
      title="Admin dashboard"
      className="press state-layer grid h-12 w-12 flex-none place-items-center rounded-full text-md-on-surface-variant"
    >
      <ShieldIcon />
    </Link>
  );
}

/**
 * Tracks whether the page has left the top, for M3's **on-scroll** app bar
 * colour. Material raises the bar from `surface` to `surface-container` the
 * moment content slides under it, which is what separates the bar from the
 * page without a permanent border.
 *
 * Deliberately cheap: a passive listener, one rAF coalesce per frame, and a
 * functional `setState` that returns the previous value unless the threshold
 * is actually crossed — so a long scroll causes exactly two renders.
 */
function useScrolled(threshold = 4) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const next = window.scrollY > threshold;
      setScrolled((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(read);
    };

    read(); // the page can mount already scrolled (restored position, #hash)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return scrolled;
}

/**
 * **Material 3 small top app bar** — the single app bar for every signed-in
 * screen (journey, dashboard, calendar, saved, profile). It replaces four
 * near-identical hand-rolled headers that each crammed three or four 14px text
 * links into one row, with targets well under the 48px minimum.
 *
 * Anatomy: a leading navigation icon (the back affordance) in a 48dp target, a
 * `title-lg` headline, then trailing icon buttons. 64dp tall — M3's small app
 * bar height, which `--app-bar-h` now carries, so the row fills the box that
 * `pt-app-bar` reserves for it on every screen.
 *
 * Colour follows M3's on-scroll rule: `surface` at rest, `surface-container`
 * plus elevation 2 once the page scrolls under it.
 *
 * Mobile: back affordance (or logo) + screen title + trailing actions. Primary
 * destinations move to <BottomNav>, which has room for real touch targets.
 * Desktop (md+): wordmark + inline destination links, as before.
 *
 * The bar is opaque — no `backdrop-filter`. That is both the Material
 * behaviour and a deliberate safety fix: a backdrop filter makes an element a
 * containing block for `position: fixed` descendants, so anything fixed
 * rendered through `children` would have sized itself to the bar. Overlays
 * should still be portalled to `document.body` regardless (see
 * `components/md/Dialog.tsx`), but the trap no longer exists here.
 *
 * Fixed, so it pays back `viewport-fit=cover` with `pt-safe` — the only place
 * the top inset is applied on these screens.
 */
export function AppBar({ title, back, actions = [], children, className }: AppBarProps) {
  const router = useRouter();
  const showBack = Boolean(back);
  const scrolled = useScrolled();

  const navIconClass =
    "press state-layer -ml-1 grid h-12 w-12 flex-none place-items-center rounded-full text-md-on-surface md:hidden";

  return (
    <header
      className={clsx(
        "pt-safe fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-base ease-standard",
        scrolled
          ? "bg-md-surface-container shadow-e2"
          : "bg-md-surface shadow-none",
        className
      )}
    >
      <div className="mx-auto flex h-app-bar max-w-6xl items-center gap-1 px-2 sm:px-4">
        {/* Leading: navigation icon on mobile when there's a parent screen,
            else the wordmark. */}
        {showBack ? (
          typeof back === "string" ? (
            <Link href={back} aria-label="Go back" className={navIconClass}>
              <ArrowBackIcon />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className={navIconClass}
            >
              <ArrowBackIcon />
            </button>
          )
        ) : null}

        <Link
          href="/"
          aria-label="Vidhyora home"
          className={clsx(
            "state-layer group flex min-h-touch flex-none items-center gap-2.5 rounded-full px-2",
            // When a back button is present the logo would be redundant
            // clutter on a 360px bar — desktop still shows it.
            showBack && "hidden md:flex"
          )}
        >
          <span className="logo-chip flex h-9 w-9 items-center justify-center transition-transform duration-base ease-standard group-hover:scale-110">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vidhyora-logo.png" alt="" width={36} height={36} className="h-9 w-9" />
          </span>
          <span className="text-title-lg font-medium text-md-on-surface">Vidhyora</span>
        </Link>

        {/* Headline — the "where am I" anchor on mobile */}
        {title && (
          <h1
            className={clsx(
              "min-w-0 flex-1 truncate px-1 text-title-lg font-medium text-md-on-surface",
              showBack ? "md:hidden" : "hidden"
            )}
          >
            {title}
          </h1>
        )}

        {/* Spacer. When the mobile headline is rendered it is already the
            growing element — a second `flex-1` next to it halves the width
            available to the title and truncates it early at 360px. Desktop
            (where the title is `md:hidden`) still needs the spacer, so it
            only grows from md up in that case. */}
        <div className={clsx("flex-1", title && showBack && "hidden md:block")} />

        {/* Desktop destinations — mobile uses the bottom nav instead */}
        {actions.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="press state-layer flex min-h-touch items-center rounded-full px-4 text-label-lg text-md-on-surface-variant"
              >
                {a.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Trailing icon buttons. Callers pass icon-only controls below `md`;
            the row keeps them on the 48dp grid. */}
        <div className="flex flex-none items-center gap-1">
          {children}
          <AdminLink />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
