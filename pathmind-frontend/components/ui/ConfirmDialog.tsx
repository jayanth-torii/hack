"use client";

import { create } from "zustand";
import { type ReactNode } from "react";
import { clsx } from "@/lib/clsx";
import { Dialog } from "@/components/md/Dialog";
import { MdButton } from "@/components/md/Button";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` uses the M3 error role; `accent` uses primary. */
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

  // M3 puts a 24dp hero icon above the headline, tinted with the role the
  // dialog is about — error for destructive, secondary for everything else.
  return (
    <span
      className={clsx(
        "flex h-14 w-14 flex-none items-center justify-center rounded-lg",
        tone === "danger"
          ? "bg-md-error-container text-md-on-error-container"
          : "bg-md-secondary-container text-md-on-secondary-container"
      )}
    >
      {icon}
    </span>
  );
}

/**
 * Mount once in the root providers. Renders the confirmation as a Material 3
 * dialog: a centred modal on desktop, a **full-screen page on phones** with a
 * back arrow and hardware-Back support — see `components/md/Dialog.tsx`.
 *
 * `alertdialog` rather than `dialog`, because the content is the decision
 * itself and screen readers should announce it immediately.
 */
export function ConfirmDialogHost() {
  const options = useConfirmStore((s) => s.options);
  const close = useConfirmStore((s) => s.close);
  const tone = options?.tone ?? "accent";

  return (
    <Dialog
      open={!!options}
      onClose={() => close(false)}
      role="alertdialog"
      title={options?.title ?? ""}
      // The icon + headline + body below ARE M3's basic-dialog anatomy, so the
      // surface must not also draw a headline above `md`. The phone app bar
      // still shows the title.
      headline={false}
      labelledBy="confirm-title"
      describedBy={options?.message ? "confirm-message" : undefined}
      actions={
        <>
          {/* Cancel first in the DOM so it is the Tab-order default and the
              destructive action is never one stray Enter away. M3 orders the
              confirming action last visually on desktop; on phones both are
              full-width and stacked, cancel underneath. */}
          <MdButton variant="text" onClick={() => close(false)} className="md:order-1">
            {options?.cancelLabel ?? "Cancel"}
          </MdButton>
          <MdButton
            variant="filled"
            onClick={() => close(true)}
            className={clsx(
              "md:order-2",
              tone === "danger" && "bg-md-error text-md-on-error"
            )}
          >
            {options?.confirmLabel ?? "Confirm"}
          </MdButton>
        </>
      }
    >
      <div className="flex flex-col items-center text-center md:items-start md:text-left">
        <ConfirmIcon tone={tone} />
        <h2
          id="confirm-title"
          className="mt-4 text-headline-sm font-normal text-md-on-surface md:mt-4"
        >
          {options?.title}
        </h2>
        {options?.message && (
          <p id="confirm-message" className="mt-2 text-body-md text-md-on-surface-variant">
            {options.message}
          </p>
        )}
      </div>
    </Dialog>
  );
}
