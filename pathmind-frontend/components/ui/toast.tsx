"use client";

import { create } from "zustand";
import { useEffect, type ReactNode, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { clsx } from "@/lib/clsx";

export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

const DURATION: Record<ToastTone, number> = {
  success: 4200,
  error: 6000,
  warning: 5200,
  info: 4200,
};

/**
 * Tone styling for an M3 snackbar.
 *
 * The snackbar container is `inverse-surface` — a *light* surface in the dark
 * scheme — so the tone colours are the dark `on-*` roles, which are the ones
 * Material designs to sit on a light container. Using `md-success` (a pale
 * green meant for dark surfaces) here would be unreadable.
 *
 * Every tone also carries an icon: status is never colour alone.
 */
const TONE_STYLES: Record<ToastTone, { fg: string; bar: string; icon: ReactNode }> = {
  success: {
    fg: "text-md-on-success",
    bar: "bg-md-on-success",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="m5 12.5 4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  error: {
    fg: "text-md-on-error",
    bar: "bg-md-on-error",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 8v5m0 3.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  warning: {
    fg: "text-md-on-warning",
    bar: "bg-md-on-warning",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M10.3 4.9 2.9 17.4A1.8 1.8 0 0 0 4.5 20h15a1.8 1.8 0 0 0 1.6-2.6L13.7 4.9a1.9 1.9 0 0 0-3.4 0Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M12 9.5v4m0 3v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    fg: "text-md-on-info",
    bar: "bg-md-on-info",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 11v5m0-8.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
};

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
}

let seq = 0;
const nextId = () => `toast-${Date.now()}-${++seq}`;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId();
    // Keep at most 4 visible so the stack never overwhelms the viewport.
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...toast, id }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Module-level API — callable from anywhere (event handlers, hooks, utils). */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: "success", title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: "error", title, description }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: "warning", title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: "info", title, description }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};

/**
 * One Material 3 **snackbar**: `inverse-surface` container, `inverse-on-surface`
 * text, the 4dp extra-small shape, elevation 3, and a single line of
 * `body-md`. The trailing control is M3's snackbar action slot, tinted
 * `inverse-primary`.
 */
function ToastView({ item, onDone }: { item: ToastItem; onDone: (id: string) => void }) {
  const reduce = useReducedMotion();
  const style = TONE_STYLES[item.tone];
  const duration = DURATION[item.tone];

  // Auto-dismiss. Restarting the timer when the item changes is safe because
  // each toast renders its own view with a stable id.
  useEffect(() => {
    const t = setTimeout(() => onDone(item.id), duration);
    return () => clearTimeout(t);
  }, [item.id, item.tone, duration, onDone]);

  return (
    <motion.div
      layout
      role="status"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      // The stack is pointer-events-none so it never blocks the page; each
      // card has to opt back in or its dismiss button can't be tapped.
      className="pointer-events-auto relative w-full overflow-hidden rounded-xs bg-md-inverse-surface shadow-e3"
    >
      <div className="flex min-h-12 items-center gap-3 py-2 pl-4 pr-2">
        <span className={clsx("flex-none", style.fg)}>{style.icon}</span>

        <div className="min-w-0 flex-1 py-1">
          <p className="text-body-md text-md-inverse-on-surface">{item.title}</p>
          {item.description && (
            <p className="mt-0.5 text-body-sm text-md-inverse-on-surface/80">{item.description}</p>
          )}
        </div>

        {/* Snackbar action slot. 44px square clears the touch floor without a
            pseudo-element trick, and sits in the M3 action colour. */}
        <button
          type="button"
          onClick={() => onDone(item.id)}
          aria-label="Dismiss notification"
          className="press state-layer grid h-11 w-11 flex-none place-items-center rounded-full text-md-inverse-primary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Lifetime progress bar — the only cue that the snackbar is timed. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-md-inverse-on-surface/15">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          className={clsx("h-full", style.bar)}
        />
      </div>
    </motion.div>
  );
}

/**
 * Mount once in the root providers — renders the snackbar stack.
 *
 * The stack also publishes its own height as `--snackbar-lift` on the document
 * element. Material specifies that a FAB **moves up** to make room for a
 * snackbar rather than being covered by one, and both sit bottom-right at every
 * breakpoint here, so they would otherwise overlap on phone and desktop alike.
 * Publishing a variable keeps that contract one-way: the snackbar knows
 * nothing about who lifts, and any future floating control can opt in with a
 * `translateY` — no shared z-index negotiation, no import cycle.
 */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const node = stackRef.current;

    const publish = () => {
      // Measured rather than computed: toast height depends on whether a
      // description wrapped, which no constant can know up front.
      const h = toasts.length === 0 ? 0 : (node?.offsetHeight ?? 0);
      root.style.setProperty("--snackbar-lift", h === 0 ? "0px" : `${h + 12}px`);
    };

    publish();
    if (!node || toasts.length === 0) return;

    // The stack grows and shrinks as toasts enter and leave, and the exit
    // animation changes its height over time — observe rather than sample once.
    const ro = new ResizeObserver(publish);
    ro.observe(node);
    return () => {
      ro.disconnect();
      root.style.setProperty("--snackbar-lift", "0px");
    };
  }, [toasts]);

  return (
    <div
      ref={stackRef}
      aria-live="polite"
      // The M3 navigation bar is fixed and 80px tall (+ safe inset) below
      // `md`, so a snackbar pinned to `bottom-4` lands behind it on every
      // phone. Sit above the nav until the breakpoint where the nav
      // disappears — `--bottom-nav-h` keeps the two in step automatically.
      className="pointer-events-none fixed inset-x-4 bottom-[calc(var(--bottom-nav-h)_+_var(--safe-bottom)_+_0.75rem)] z-[100] flex flex-col items-stretch gap-3 sm:inset-x-auto sm:right-6 sm:w-96 md:bottom-6"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastView key={t.id} item={t} onDone={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
