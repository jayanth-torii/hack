import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { clsx } from "@/lib/clsx";
import {
  mdButtonClasses,
  mdIconClasses,
  type MdButtonSize,
  type MdButtonVariant,
} from "@/components/md/Button";

// Aliases, not a second ladder — the variants ARE the button's variants.
export type ActionLinkVariant = MdButtonVariant;
export type ActionLinkSize = MdButtonSize;

/**
 * A Material 3 **common button that navigates**.
 *
 * `components/ui/Button` is the button for actions and is deliberately a
 * `<button>` element — it has no `href`, and CLAUDE.md §6 requires `a` for
 * navigation, so a marketing CTA that goes somewhere cannot be one. This is
 * that missing half: the same M3 emphasis ladder (filled → tonal → elevated →
 * outlined → text), the same shape, the same `.state-layer` feedback, rendered
 * as a link. It does not restate the recipe — it imports `mdButtonClasses`
 * from `components/md/Button.tsx`, so the two cannot drift apart.
 *
 * Emphasis is a ladder, not a palette: **filled** is the single primary action
 * of a view, **tonal** a secondary action that still needs weight, **elevated**
 * a button that has to separate itself from a patterned background (the video
 * band), **outlined** a neutral alternative and **text** the lowest emphasis.
 *
 * Internal routes go through `next/link`; in-page anchors stay plain `<a>` so
 * the browser's own hash scrolling (and the global `scroll-padding-top` that
 * clears the app bar) keeps working untouched.
 */
export interface ActionLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ActionLinkVariant;
  size?: ActionLinkSize;
  /** Leading icon — 18px on `sm`, 20px otherwise. Decorative; the label carries meaning. */
  icon?: ReactNode;
  /** Trailing icon, for the "onward" arrow the marketing CTAs use. */
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

export function ActionLink({
  href,
  variant = "filled",
  size = "md",
  icon,
  trailingIcon,
  fullWidth,
  className,
  children,
  ...rest
}: ActionLinkProps) {
  const iconSize = mdIconClasses(size);

  // `group/btn` is the one addition over the shared recipe: the trailing arrow
  // slides on hover, and a link needs its own group name so it doesn't catch a
  // parent card's `group`.
  const classes = mdButtonClasses({
    variant,
    size,
    fullWidth,
    className: clsx("group/btn", !fullWidth && "w-auto", className),
  });

  const content = (
    <>
      {icon && (
        <span aria-hidden className={iconSize}>
          {icon}
        </span>
      )}
      {children}
      {trailingIcon && (
        <span
          aria-hidden
          className={clsx(
            "transition-transform duration-base ease-emphasized",
            "group-hover/btn:translate-x-1",
            iconSize
          )}
        >
          {trailingIcon}
        </span>
      )}
    </>
  );

  // In-page anchors keep the native hash behaviour (and the global
  // `scroll-padding-top` that clears the app bar); absolute URLs — the OAuth
  // hand-off, mail links — leave the app entirely, so neither belongs on the
  // client router. Everything else is an internal route.
  if (/^(#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {content}
    </Link>
  );
}

/** The onward arrow shared by the marketing CTAs — 24px grid, 1.8 stroke. */
export function ArrowForwardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4.5 12h15m0 0-5.6-5.6M19.5 12l-5.6 5.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
