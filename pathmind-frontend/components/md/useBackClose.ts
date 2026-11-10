"use client";

import { useEffect, useRef } from "react";

/**
 * Makes a full-screen surface behave like a pushed page on phones: the
 * hardware/browser Back button closes it instead of leaving the screen
 * underneath.
 *
 * Material's full-screen dialog *is* a navigation destination — it has a back
 * arrow, not a close button — so Back has to work, or the gesture every
 * Android user reaches for first takes them out of the app entirely.
 *
 * While `open`, one history entry is pushed at the same URL (Next's own router
 * state is copied across so the App Router treats the pop as a same-page
 * navigation rather than a reload). A Back press calls `onClose`. Closing from
 * the UI pops that entry again, so Back never needs two presses afterwards.
 *
 * Desktop (>= `md`) is untouched: there the dialog is a centred modal, Escape
 * closes it, and hijacking Back would be wrong.
 */
export function useBackClose(open: boolean, onClose: () => void) {
  // Held in a ref so a changing `onClose` identity can't re-run the effect and
  // push a second history entry.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 767.98px)").matches) return;

    const marker = `md-page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    window.history.pushState({ ...(window.history.state ?? {}), __mdPage: marker }, "");

    let poppedByUser = false;
    const onPop = () => {
      // A forward navigation landed back on our own entry — nothing to do.
      if ((window.history.state as { __mdPage?: string } | null)?.__mdPage === marker) return;
      poppedByUser = true;
      closeRef.current();
    };

    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Closed from the UI (button, Escape, backdrop): drop our entry so the
      // next Back press goes where the user expects.
      if (
        !poppedByUser &&
        (window.history.state as { __mdPage?: string } | null)?.__mdPage === marker
      ) {
        window.history.back();
      }
    };
  }, [open]);
}
