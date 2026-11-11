"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/home/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { confirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";
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
 * Account control, matching the landing page header: an avatar chip linking to
 * /profile plus a Log out action for signed-in users, Log in + Get started
 * otherwise.
 *
 * Desktop-only. On a phone the account lives in the bottom nav's Profile
 * destination, and a 64px bar has no room for an email address.
 */
function AccountControls() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const initial = user?.email?.charAt(0).toUpperCase() ?? "V";

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign out of Vidhyora?",
      message:
        "Your roadmaps and progress are saved — you can pick up right where you left off.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay signed in",
      tone: "danger",
    });
    if (!ok) return;
    await logout();
    toast.success("Signed out", "See you soon.");
  };

  if (!user) {
    return (
      <div className="hidden items-center gap-1 lg:flex">
        <Link
          href="/auth/login"
          className="press state-layer flex min-h-touch items-center rounded-full px-4 text-label-lg text-md-on-surface-variant"
        >
          Log in
        </Link>
        <Link
          href="/auth/register"
          className="press state-layer flex min-h-touch items-center rounded-full bg-md-primary px-6 text-label-lg text-md-on-primary shadow-e1"
        >
          Get started
        </Link>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-1 lg:flex">
      <Link
        href="/profile"
        className="state-layer flex min-h-touch items-center gap-2.5 rounded-full border border-md-outline-variant py-1.5 pl-1.5 pr-4"
        aria-label="Open your profile"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-md-primary text-label-lg text-md-on-primary">
          {initial}
        </span>
        <span className="max-w-[9rem] truncate text-label-lg text-md-on-surface-variant">
          {user.email}
        </span>
      </Link>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="press state-layer flex min-h-touch items-center rounded-full px-4 text-label-lg text-md-on-surface-variant"
      >
        Log out
      </button>
    </div>
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
 * **The** app bar for every signed-in screen (journey, dashboard, calendar,
 * courses, saved, profile, admin). It replaced four near-identical hand-rolled
 * headers; don't add a fifth.
 *
 * It now wears the landing page's frosted treatment — translucent `surface`,
 * blur and a saturation boost — so crossing from the marketing site into the
 * product doesn't feel like crossing into a different product. Previously this
 * bar was flat and opaque while the landing header was glass, which made the
 * app look like an unfinished second system.
 *
 * Anatomy: leading navigation icon (back) in a 48dp target, `title-lg`
 * headline, destination links carrying a real **active state**, then the
 * account chip, admin entry and theme toggle. 64dp tall — M3's small app bar
 * height, which `--app-bar-h` carries, so the row fills the box `pt-app-bar`
 * reserves on every screen.
 *
 * Mobile keeps back + title + trailing icons; primary destinations live in
 * <BottomNav>, which has room for real touch targets.
 *
 * **`backdrop-filter` makes this a containing block for `position: fixed`
 * descendants.** Anything fixed passed through `children` would size itself to
 * this bar rather than the viewport, so overlays must portal to
 * `document.body` — which `md/Dialog` and `ConfirmDialog` already do. Today
 * every caller passes plain buttons; keep it that way.
 *
 * Fixed, so it pays back `viewport-fit=cover` with `pt-safe` — the only place
 * the top inset is applied on these screens.
 */
export function AppBar({ title, back, actions = [], children, className }: AppBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const showBack = Boolean(back);
  const scrolled = useScrolled();

  const navIconClass =
    "press state-layer -ml-1 grid h-12 w-12 flex-none place-items-center rounded-full text-md-on-surface md:hidden";

  return (
    <header
      className={clsx(
        "pt-safe fixed inset-x-0 top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-base ease-standard",
        "backdrop-blur-2xl backdrop-saturate-150",
        scrolled
          ? "border-md-outline-variant/60 bg-md-surface/80 shadow-e2"
          : "border-md-outline-variant/40 bg-md-surface/70 shadow-none",
        className
      )}
    >
      <div className="mx-auto flex h-app-bar max-w-7xl items-center gap-1 px-2 sm:px-4 md:px-6">
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

        {/* Desktop destinations — mobile uses the bottom nav instead. The
            active destination is named by `aria-current` and shown by a 2dp
            indicator, so "where am I" doesn't rest on colour alone. */}
        {actions.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
            {actions.map((a) => {
              const active = pathname === a.href;
              return (
                <Link
                  key={a.href}
                  href={a.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "press state-layer relative flex min-h-touch items-center rounded-full px-4 text-label-lg transition-colors duration-fast ease-standard",
                    active ? "text-md-on-surface" : "text-md-on-surface-variant"
                  )}
                >
                  {a.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-4 bottom-1.5 h-0.5 rounded-full bg-md-primary"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Trailing. Callers pass icon-only controls below `md`; the row keeps
            them on the 48dp grid. */}
        <div className="flex flex-none items-center gap-1">
          {children}
          <AccountControls />
          <AdminLink />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
