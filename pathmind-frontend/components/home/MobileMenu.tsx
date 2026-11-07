"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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
 * Full-height navigation sheet for the marketing header on phones.
 *
 * Replaces the previous inline dropdown, which was a 14px-row list with no
 * scroll lock, no Escape handling and no focus management — so the page
 * scrolled underneath it and keyboard focus wandered into the hidden page.
 *
 * This version: scrim + right-hand sheet, body scroll locked while open,
 * Escape closes, focus moves into the sheet on open and returns to the
 * trigger on close, Tab is trapped inside, every row is a ≥48px target, and
 * the sheet pays back `viewport-fit=cover` with its own safe-area padding.
 */
export function MobileMenu({ open, onClose, links, user, onLogout }: MobileMenuProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  // The sheet must be portalled to <body>. Its trigger lives inside the
  // header, and that header has `backdrop-blur` — a backdrop-filter makes
  // the element a containing block for `position: fixed` descendants, so a
  // sheet rendered in place sizes itself to the 56px header instead of the
  // viewport. Portalling escapes that containing block (and is the right
  // thing for a modal regardless, since it also escapes any stacking or
  // overflow context the header imposes).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

  const rowClass =
    "press flex min-h-touch items-center rounded-sm px-3 text-base font-medium text-subtle transition-colors duration-fast hover:bg-line/5 hover:text-accent";

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
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm md:hidden"
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
            className="pt-safe pb-safe fixed inset-y-0 right-0 z-[61] flex w-[min(20rem,86vw)] flex-col border-l border-line/10 bg-card shadow-e3 md:hidden"
          >
            <div className="flex h-app-bar flex-none items-center justify-between px-3">
              <span className="px-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent-text">
                Menu
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="press flex h-touch w-touch items-center justify-center rounded-full text-paper transition-colors duration-fast hover:bg-line/10"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable so the sheet survives small screens and large text */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Mobile">
              <ul className="flex flex-col gap-1">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} onClick={onClose} className={rowClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="my-4 h-px bg-line/10" />

              {user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="press flex min-h-touch items-center gap-3 rounded-sm px-3 transition-colors duration-fast hover:bg-line/5"
                  >
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-paper">
                        {user.email}
                      </span>
                      <span className="block text-xs text-muted">View profile</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="press flex min-h-touch w-full items-center justify-center rounded-sm border border-danger/30 px-4 text-sm font-semibold text-danger transition-colors duration-fast hover:bg-danger/10"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/auth/register"
                    onClick={onClose}
                    className="press flex min-h-touch items-center justify-center rounded-sm bg-accent px-5 text-sm font-bold tracking-tight text-on-accent shadow-e2"
                  >
                    Get started
                  </Link>
                  <Link
                    href="/auth/login"
                    onClick={onClose}
                    className="press flex min-h-touch items-center justify-center rounded-sm border border-line/15 px-5 text-sm font-semibold text-subtle transition-colors duration-fast hover:border-accent/50 hover:text-accent"
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
