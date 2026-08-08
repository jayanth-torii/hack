"use client";

import { create } from "zustand";
import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { clsx } from "@/lib/clsx";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger → rose actions; accent → lime actions. */
  tone?: "danger" | "accent";
}

interface ConfirmState {
  options: ConfirmOptions | null;
  resolver: ((result: boolean) => void) | null;
  open: (options: ConfirmOptions) => Promise<boolean>;
  close: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  options: null,
  resolver: null,
  open: (options) =>
    new Promise<boolean>((resolve) => {
      set({ options, resolver: resolve });
    }),
  close: (result) => {
    get().resolver?.(result);
    set({ options: null, resolver: null });
  },
}));

/**
 * SweetAlert-style confirmation. Resolves `true` when the user confirms,
 * `false` when they cancel (button, backdrop click, or Escape).
 *
 *   const ok = await confirm({
 *     title: "Delete roadmap?",
 *     message: "This can't be undone.",
 *     confirmLabel: "Delete",
 *     tone: "danger",
 *   });
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().open(options);
}

function ConfirmIcon({ tone }: { tone: NonNullable<ConfirmOptions["tone"]> }) {
  const icon: ReactNode =
    tone === "danger" ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M10.3 4.9 2.9 17.4A1.8 1.8 0 0 0 4.5 20h15a1.8 1.8 0 0 0 1.6-2.6L13.7 4.9a1.9 1.9 0 0 0-3.4 0Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M12 9.5v4m0 3v.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 11v5m0-8.5v.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    );

  return (
    <span
      className={clsx(
        "flex h-16 w-16 flex-none items-center justify-center rounded-3xl",
        tone === "danger"
          ? "bg-rose-400/15 text-rose-300 ring-1 ring-inset ring-rose-400/30"
          : "bg-accent/15 text-accent ring-1 ring-inset ring-accent/30"
      )}
    >
      {icon}
    </span>
  );
}

/** Mount once in the root providers — renders the centered modal when opened. */
export function ConfirmDialogHost() {
  const options = useConfirmStore((s) => s.options);
  const close = useConfirmStore((s) => s.close);
  const reduce = useReducedMotion();
  const confirmRef = useRef<HTMLButtonElement>(null);

  const tone = options?.tone ?? "accent";

  // Escape closes (cancels). Autofocus the confirm action like SweetAlert2.
  useEffect(() => {
    if (!options) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, close]);

  return (
    <AnimatePresence>
      {options && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => close(false)}
        >
          <motion.div
            key="confirm-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-line/10 bg-card/95 p-7 text-center shadow-2xl shadow-black/40 backdrop-blur-2xl"
          >
            {/* top shine */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line/25 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,243,29,0.12),transparent_65%)]"
            />

            <div className="relative">
              <div className="flex justify-center">
                <ConfirmIcon tone={tone} />
              </div>
              <h2
                id="confirm-title"
                className="mt-5 font-display text-xl font-semibold tracking-tight text-paper"
              >
                {options.title}
              </h2>
              {options.message && (
                <p id="confirm-message" className="mt-2 text-sm leading-relaxed text-muted">
                  {options.message}
                </p>
              )}

              <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="rounded-full border border-line/15 px-6 py-2.5 text-sm font-medium text-subtle transition-colors hover:border-line/30 hover:text-paper"
                >
                  {options.cancelLabel ?? "Cancel"}
                </button>
                <button
                  ref={confirmRef}
                  type="button"
                  onClick={() => close(true)}
                  className={clsx(
                    "rounded-full px-7 py-2.5 text-sm font-bold tracking-tight shadow-lg transition-all hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    tone === "danger"
                      ? "bg-rose-500 text-white shadow-rose-500/25 hover:bg-rose-400"
                      : "bg-accent text-on-accent shadow-accent/25 hover:bg-accent/90"
                  )}
                >
                  {options.confirmLabel ?? "Confirm"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
