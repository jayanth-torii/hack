"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { clsx } from "@/lib/clsx";
import { useBackClose } from "@/components/md/useBackClose";

interface NavLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  user: { email: string } | null;
  onLogout: () => void;
}

/**
 * **Material 3 modal navigation drawer** for the marketing header on phones.
 *
 * Replaces the previous inline dropdown, which was a 14px-row list with no
 * scroll lock, no Escape handling and no focus management — so the page
 * scrolled underneath it and keyboard focus wandered into the hidden page.
 *
 * M3 anatomy: a `surface-container-low` sheet with a 28dp radius on its inner
 * edge, destinations as 56dp `rounded-full` rows, and a `secondary-container`
 * **active indicator** behind the current destination rather than a colour
 * change alone.
 *
 * Behaviour: scrim + sheet, body scroll locked while open, Escape closes,
 * focus moves into the sheet on open and returns to the trigger on close, Tab
 * is trapped inside, every row is a ≥48px target, and the sheet pays back
 * `viewport-fit=cover` with its own safe-area padding (once per side).
 * `useBackClose` makes the hardware Back button close it like a pushed page,
 * which is what a full-height navigation surface has to do on Android.
 */
export function MobileMenu({ open, onClose, links, user, onLogout }: MobileMenuProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const pathname = usePathname() ?? "";

  // The sheet must be portalled to <body>. Its trigger lives inside the
  // header, and that header has `backdrop-blur` — a backdrop-filter makes
  // the element a containing block for `position: fixed` descendants, so a
  // sheet rendered in place sizes itself to the header instead of the
  // viewport. Portalling escapes that containing block (and is the right
  // thing for a modal regardless, since it also escapes any stacking or
  // overflow context the header imposes).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Hardware/browser Back closes the drawer instead of leaving the page.
  useBackClose(open, onClose);

  // Remember what had focus so it can be restored on close.
  useEffect(() => {
    if (open) restoreFocusRef.current = document.activeElement as HTMLElement | null;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    // Lock the page behind the sheet. Preserving the inline value means we
    // never clobber a scroll lock another overlay (dialog/toast) already set.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    // Move focus into the sheet so the next Tab stays inside it.
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [open]);

  // Only route links can be "current" — the in-page anchors (#features…) are
  // scroll targets, not destinations.
  const isCurrent = (href: string) =>
    href.startsWith("/") && (pathname === href || pathname.startsWith(`${href}/`));

  /**
   * Close the drawer for something that will itself push history — a
   * destination link, or the sign-out confirmation.
   *
   * `useBackClose` pushes an entry while the drawer is open and pops it again
   * when the drawer closes from the UI. A link tap does both in one gesture:
   * React flushes our close (and therefore the hook's `history.back()`) in the
   * urgent commit, while Next commits its `pushState` later, in the
   * transition's insertion effect. The queued pop is resolved against the
   * history *after* that push, so it lands on the entry before the new page
   * and silently undoes the navigation. The hook's own guard can't catch it:
   * Next 14 spreads the previous `history.state` into the new entry, so its
   * marker is still there.
   *
   * Clearing the marker off the current entry makes that guard fail, so the
   * close leaves history alone and the navigation stands. The cost is one
   * redundant entry at the URL the drawer was opened on — invisible, since
   * both entries render the same page.
   */
  const closeForNavigation = () => {
    if (typeof window !== "undefined") {
      const state = { ...(window.history.state ?? {}) } as Record<string, unknown>;
      if (state.__mdPage) {
        delete state.__mdPage;
        window.history.replaceState(state, "");
      }
    }
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim — tap anywhere outside to dismiss */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
            className="fixed inset-0 z-[60] bg-md-scrim/40 md:hidden"
          />

          <motion.div
            key="sheet"
            id="mobile-menu"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={
              reduce
                ? { duration: 0.15 }
                : { type: "spring", stiffness: 420, damping: 40, mass: 0.9 }
            }
            className="pt-safe pb-safe fixed inset-y-0 right-0 z-[61] flex w-[min(20rem,86vw)] flex-col rounded-l-xl bg-md-surface-container-low shadow-e3 md:hidden"
          >
            <div className="flex h-app-bar flex-none items-center justify-between px-3">
              <span className="px-3 text-title-sm text-md-on-surface-variant">Menu</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="press state-layer grid h-12 w-12 place-items-center rounded-full text-md-on-surface-variant"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable so the sheet survives small screens and large text */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Mobile">
              <ul className="flex flex-col gap-1">
                {links.map((link) => {
                  const current = isCurrent(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={closeForNavigation}
                        aria-current={current ? "page" : undefined}
                        className={clsx(
                          // 56dp M3 drawer row with a pill active indicator.
                          "press state-layer flex h-14 items-center rounded-full px-6 text-label-lg",
                          current
                            ? "bg-md-secondary-container text-md-on-secondary-container"
                            : "text-md-on-surface-variant"
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="my-4 h-px bg-md-outline-variant/60" />

              {user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/profile"
                    onClick={closeForNavigation}
                    className="press state-layer flex h-14 items-center gap-3 rounded-full px-4 text-md-on-surface-variant"
                  >
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-md-primary text-label-lg text-md-on-primary">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-label-lg text-md-on-surface">
                        {user.email}
                      </span>
                      <span className="block text-body-sm text-md-on-surface-variant">
                        View profile
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      // The confirmation dialog pushes its own entry, so this
                      // close must not pop ours out from under it.
                      closeForNavigation();
                      onLogout();
                    }}
                    className="press state-layer flex min-h-touch w-full items-center justify-center rounded-full border border-md-outline px-4 text-label-lg text-md-error"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/auth/register"
                    onClick={closeForNavigation}
                    className="press state-layer flex min-h-touch items-center justify-center rounded-full bg-md-primary px-6 text-label-lg text-md-on-primary shadow-e1"
                  >
                    Get started
                  </Link>
                  <Link
                    href="/auth/login"
                    onClick={closeForNavigation}
                    className="press state-layer flex min-h-touch items-center justify-center rounded-full border border-md-outline px-6 text-label-lg text-md-primary"
                  >
                    Log in
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
