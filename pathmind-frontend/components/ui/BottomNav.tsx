"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { clsx } from "@/lib/clsx";

/* ── Icons ────────────────────────────────────────────────────────────────
   One coherent family: 24px grid, 1.8 stroke, round caps — matching the
   inline SVGs already used across the app rather than pulling in a second
   icon set.

   Material 3 navigation bars swap the icon from OUTLINE to FILLED on the
   active destination, so each icon ships both renderings. That is the second,
   non-colour cue for "selected" (the indicator pill is the third), which keeps
   the active state readable without relying on hue. */

type IconProps = { filled?: boolean };

const svgProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const JourneyIcon = ({ filled }: IconProps) => (
  <svg {...svgProps} {...strokeProps} strokeWidth={filled ? 2.1 : 1.8}>
    <path d="M4 19V7a3 3 0 0 1 3-3h4" />
    <path d="M20 5v12a3 3 0 0 1-3 3h-4" />
    <path d="M11 4h2M11 20h2" />
    <circle cx="4" cy="19" r="2.1" fill={filled ? "currentColor" : "none"} />
    <circle cx="20" cy="5" r="2.1" fill={filled ? "currentColor" : "none"} />
  </svg>
);

const DashboardIcon = ({ filled }: IconProps) =>
  filled ? (
    <svg {...svgProps} fill="currentColor">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ) : (
    <svg {...svgProps} {...strokeProps}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );

const CalendarIcon = ({ filled }: IconProps) =>
  filled ? (
    <svg {...svgProps} fill="currentColor">
      {/* Solid body with punched-out date dots (even-odd), so the filled
          variant still reads as a calendar and not a plain rounded square. */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2.2a.9.9 0 0 1 .9.9v1.4h6.2V3.1a.9.9 0 1 1 1.8 0v1.4h.6A3.5 3.5 0 0 1 21 8v10a3.5 3.5 0 0 1-3.5 3.5h-11A3.5 3.5 0 0 1 3 18V8a3.5 3.5 0 0 1 3.5-3.5h.6V3.1a.9.9 0 0 1 .9-.9ZM7.5 12.4a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Zm4.5 0a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Zm4.5 0a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Z"
      />
    </svg>
  ) : (
    <svg {...svgProps} {...strokeProps}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );

const SavedIcon = ({ filled }: IconProps) =>
  filled ? (
    <svg {...svgProps} fill="currentColor">
      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />
    </svg>
  ) : (
    <svg {...svgProps} {...strokeProps}>
      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />
    </svg>
  );

const ProfileIcon = ({ filled }: IconProps) =>
  filled ? (
    <svg {...svgProps} fill="currentColor">
      <circle cx="12" cy="8" r="3.8" />
      <path d="M12 13.4c-4.3 0-7.8 2.6-7.8 5.9 0 .9.7 1.6 1.6 1.6h12.4c.9 0 1.6-.7 1.6-1.6 0-3.3-3.5-5.9-7.8-5.9Z" />
    </svg>
  ) : (
    <svg {...svgProps} {...strokeProps}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );

const HomeIcon = ({ filled }: IconProps) =>
  filled ? (
    <svg {...svgProps} fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3.05 3.2 10.17V19a2.3 2.3 0 0 0 2.3 2.3h13a2.3 2.3 0 0 0 2.3-2.3v-8.83L12 3.05ZM10 14.4h4v5.4h-4v-5.4Z"
      />
    </svg>
  ) : (
    <svg {...svgProps} {...strokeProps}>
      <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.5Z" />
      <path d="M10 20.5V15h4v5.5" />
    </svg>
  );

const LoginIcon = ({ filled }: IconProps) =>
  filled ? (
    <svg {...svgProps} fill="none">
      <path
        fill="currentColor"
        d="M14 3h4a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-4a1 1 0 1 1 0-2h4a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-4a1 1 0 1 1 0-2Z"
      />
      <path {...strokeProps} strokeWidth={2.1} d="M10 16l4-4-4-4M14 12H4" />
    </svg>
  ) : (
    <svg {...svgProps} {...strokeProps}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 16l4-4-4-4M14 12H4" />
    </svg>
  );

interface Destination {
  href: string;
  label: string;
  Icon: (p: IconProps) => JSX.Element;
  /** Marks the destination active for any nested route too. */
  match?: (pathname: string) => boolean;
}

/**
 * **Material 3 navigation bar** — the phone's primary navigation.
 *
 * 80dp tall (`--bottom-nav-h`), drawn on `surface-container`, with up to four
 * destinations. Each one is M3's full anatomy: a 64×32dp **active indicator
 * pill** in `secondary-container` sitting behind the icon only while selected,
 * the icon swapping outline → filled, and an always-visible `label-md`
 * underneath. 12dp above the pill, 4dp between pill and label, 16dp below —
 * which is exactly the 80dp the token now reserves, so the bar fills its own
 * height instead of leaving a dead strip above the home indicator.
 *
 * Mobile-only by design: md+ keeps the inline links in <AppBar>. Destinations
 * are contextual — inside a roadmap you get that roadmap's three views plus
 * the library; elsewhere you get the top-level three.
 *
 * Accessibility: each item is a ≥48px target with an icon *and* a visible
 * label, `aria-current="page"` on the active one, and the active state is
 * carried by the indicator pill and the filled icon as well as colour — so it
 * reads without relying on hue. `pb-safe` is applied here and nowhere else in
 * the bar, so the home-indicator inset is paid exactly once.
 */
export function BottomNav() {
  const pathname = usePathname() ?? "";
  const user = useAuthStore((s) => s.user);
  const reduce = useReducedMotion();

  // Inside /roadmap/<id>/… surface that roadmap's own views.
  const roadmapId = pathname.match(/^\/roadmap\/([^/]+)/)?.[1];

  const destinations: Destination[] = roadmapId
    ? [
        {
          href: `/roadmap/${roadmapId}`,
          label: "Journey",
          Icon: JourneyIcon,
          match: (p) => p === `/roadmap/${roadmapId}`,
        },
        { href: `/roadmap/${roadmapId}/dashboard`, label: "Progress", Icon: DashboardIcon },
        { href: `/roadmap/${roadmapId}/calendar`, label: "Plan", Icon: CalendarIcon },
        { href: "/saved", label: "Library", Icon: SavedIcon },
      ]
    : [
        { href: "/", label: "Home", Icon: HomeIcon, match: (p) => p === "/" },
        { href: "/saved", label: "Library", Icon: SavedIcon },
        user
          ? { href: "/profile", label: "Profile", Icon: ProfileIcon }
          : { href: "/auth/login", label: "Log in", Icon: LoginIcon },
      ];

  return (
    <nav
      aria-label="Primary"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-md-outline-variant/40 bg-md-surface-container md:hidden"
    >
      <ul className="mx-auto flex h-bottom-nav max-w-md items-stretch justify-around px-1">
        {destinations.map(({ href, label, Icon, match }) => {
          const active = match ? match(pathname) : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "press flex h-full min-h-touch flex-col items-center justify-start gap-1 pb-4 pt-3",
                  active ? "text-md-on-secondary-container" : "text-md-on-surface-variant"
                )}
              >
                {/* Active indicator — 64×32dp pill behind the icon only. */}
                <span className="relative flex h-8 w-16 items-center justify-center">
                  {active &&
                    (reduce ? (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-md-secondary-container"
                      />
                    ) : (
                      <motion.span
                        layoutId="md-nav-indicator"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-md-secondary-container"
                      />
                    ))}
                  <span className="relative">
                    <Icon filled={active} />
                  </span>
                </span>
                <span className="text-label-md">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
