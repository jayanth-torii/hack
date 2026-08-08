"use client";

import { create } from "zustand";
import { useEffect, type ReactNode } from "react";
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

const TONE_STYLES: Record<
  ToastTone,
  { chip: string; bar: string; ring: string; icon: ReactNode }
> = {
  success: {
    chip: "bg-emerald-400/15 text-emerald-300",
    bar: "bg-emerald-400",
    ring: "shadow-emerald-400/10",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="m5 12.5 4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  error: {
    chip: "bg-rose-400/15 text-rose-300",
    bar: "bg-rose-400",
    ring: "shadow-rose-400/10",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 8v5m0 3.5v.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
  warning: {
    chip: "bg-amber-400/15 text-amber-300",
    bar: "bg-amber-400",
    ring: "shadow-amber-400/10",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M10.3 4.9 2.9 17.4A1.8 1.8 0 0 0 4.5 20h15a1.8 1.8 0 0 0 1.6-2.6L13.7 4.9a1.9 1.9 0 0 0-3.4 0Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M12 9.5v4m0 3v.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    chip: "bg-brand-400/15 text-brand-300",
    bar: "bg-brand-400",
    ring: "shadow-brand-400/10",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 11v5m0-8.5v.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
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
      className={clsx(
        "relative w-full overflow-hidden rounded-2xl border border-line/10 bg-card/85 shadow-2xl backdrop-blur-2xl backdrop-saturate-150",
        style.ring
      )}
    >
      {/* top shine */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line/25 to-transparent"
      />
      <div className="flex items-start gap-3 px-4 pb-3.5 pt-4">
        <span
          className={clsx(
            "flex h-8 w-8 flex-none items-center justify-center rounded-xl",
            style.chip
          )}
        >
          {style.icon}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold leading-snug text-paper">{item.title}</p>
          {item.description && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDone(item.id)}
          aria-label="Dismiss notification"
          className="flex h-6 w-6 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:bg-line/10 hover:text-paper"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {/* lifetime progress bar */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-line/5">
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

/** Mount once in the root providers — renders the toast stack bottom-right. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-stretch gap-3 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastView key={t.id} item={t} onDone={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
