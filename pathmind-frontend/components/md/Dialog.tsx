"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { clsx } from "@/lib/clsx";
import { useBackClose } from "./useBackClose";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function ArrowBackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
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

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Action buttons. Full-width and stacked on phones, right-aligned above `md`. */
  actions?: ReactNode;
  /** Width of the centred desktop dialog. Ignored on phones (always full-bleed). */
  size?: "sm" | "md" | "lg";
  /** `alertdialog` for destructive confirmations, `dialog` otherwise. */
  role?: "dialog" | "alertdialog";
  /** Clicking the scrim closes. Off for forms with unsaved input. */
  dismissible?: boolean;
  labelledBy?: string;
  describedBy?: string;
  /**
   * Whether the surface draws its own headline above `md`. M3's *basic*
   * dialog puts a hero icon, headline and body together in the content area,
   * so a caller building that anatomy passes `false` and supplies its own.
   * The phone app bar always shows `title` — a full-screen dialog is a
   * navigation destination and needs a title in the bar either way.
   */
  headline?: boolean;
}

/**
 * Material 3 dialog — **a centred modal on desktop, a full-screen page on
 * phones.**
 *
 * This is the one M3 pattern the product most needed: below `md` the surface
 * fills the viewport (`100dvh`, no radius, no border), the header becomes a
 * top app bar with a **back arrow** rather than an ✕, actions stretch to full
 * width above the home indicator, and `useBackClose` wires the hardware Back
 * button to it. A phone never sees a floating card it has to aim at.
 *
 * `100dvh` rather than `100vh`: the dynamic viewport unit tracks the mobile
 * browser's collapsing URL bar, so the action row can't be pushed off-screen.
 *
 * Rendered through a portal to `document.body` — both `AppBar` and `Header`
 * use `backdrop-blur`, which makes them containing blocks for fixed
 * descendants, so a dialog mounted inside one would size to the bar.
 *
 * Implements the modal contract in CLAUDE.md §6: focus trap, Escape, scroll
 * lock, and focus restored to whatever opened it.
 */
export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  size = "sm",
  role = "dialog",
  dismissible = true,
  labelledBy,
  describedBy,
  headline = true,
}: DialogProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useBackClose(open, onClose);

  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement as HTMLElement | null;
    // Focus the surface itself rather than the first action: on a destructive
    // confirmation, autofocusing "Delete" means a stray Enter destroys data.
    surfaceRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = surfaceRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !surfaceRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const width = { sm: "md:max-w-sm", md: "md:max-w-xl", lg: "md:max-w-3xl" }[size];

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-stretch justify-center md:items-center md:p-6">
      {/* Scrim. M3 uses the scrim role at 32% — enough to recede the page
          without hiding where you were. */}
      <div
        aria-hidden
        onClick={dismissible ? onClose : undefined}
        className="animate-md-fade absolute inset-0 bg-md-scrim/40 md:bg-md-scrim/50"
      />

      <div
        ref={surfaceRef}
        role={role}
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={clsx(
          // Phone: a full-screen page. Desktop: a centred M3 dialog.
          "animate-md-page relative z-10 flex h-[100dvh] w-full flex-col bg-md-surface-container-high text-md-on-surface outline-none",
          "md:h-auto md:max-h-[85vh] md:rounded-xl md:shadow-e3 md:animate-md-dialog",
          width
        )}
      >
        {/* Header — a top app bar on phones, a dialog headline on desktop. */}
        <div
          className={clsx(
            "flex items-center gap-1 border-b border-md-outline-variant/60 px-1 pb-2 pt-[calc(0.5rem+var(--safe-top))]",
            headline
              ? "md:block md:border-0 md:px-6 md:pb-0 md:pt-6"
              : "md:hidden"
          )}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="press state-layer grid h-12 w-12 shrink-0 place-items-center rounded-full text-md-on-surface-variant md:hidden"
          >
            <ArrowBackIcon className="h-6 w-6" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-title-lg font-medium text-md-on-surface md:whitespace-normal md:text-headline-sm">
              {title}
            </h2>
            {subtitle && (
              <p className="truncate text-body-sm text-md-on-surface-variant md:mt-2 md:whitespace-normal md:text-body-md">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div
          className={clsx(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 text-body-md text-md-on-surface-variant md:flex-none md:px-6",
            headline ? "md:py-4" : "md:pb-4 md:pt-6"
          )}
        >
          {children}
        </div>

        {actions && (
          // Phones get full-width stacked actions above the home indicator;
          // desktop gets M3's right-aligned text buttons.
          <div className="flex flex-col gap-2 border-t border-md-outline-variant/60 px-4 pb-[calc(1rem+var(--safe-bottom))] pt-3 md:flex-row md:justify-end md:border-0 md:px-6 md:pb-6 md:pt-2 [&>*]:w-full md:[&>*]:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
