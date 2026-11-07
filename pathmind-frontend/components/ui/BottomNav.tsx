"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { clsx } from "@/lib/clsx";

/* ── Icons ────────────────────────────────────────────────────────────────
   One coherent family: 24px grid, 1.8 stroke, round caps — matching the
   inline SVGs already used across the app rather than pulling in a second
   icon set. `filled` thickens the stroke on the active destination so the
   selected state is not signalled by colour alone. */

type IconProps = { filled?: boolean };
const base = (filled?: boolean) => ({
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: filled ? 2.4 : 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

const JourneyIcon = ({ filled }: IconProps) => (
  <svg {...base(filled)}>
    <path d="M4 19V7a3 3 0 0 1 3-3h4" />
    <path d="M20 5v12a3 3 0 0 1-3 3h-4" />
    <circle cx="4" cy="19" r="2" />
    <circle cx="20" cy="5" r="2" />
    <path d="M11 4h2M11 20h2" />
  </svg>
);

const DashboardIcon = ({ filled }: IconProps) => (
  <svg {...base(filled)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

const CalendarIcon = ({ filled }: IconProps) => (
  <svg {...base(filled)}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

const SavedIcon = ({ filled }: IconProps) => (
  <svg {...base(filled)}>
    <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />
  </svg>
);

const ProfileIcon = ({ filled }: IconProps) => (
  <svg {...base(filled)}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);

const HomeIcon = ({ filled }: IconProps) => (
  <svg {...base(filled)}>
    <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.5Z" />
  </svg>
);

const LoginIcon = ({ filled }: IconProps) => (
  <svg {...base(filled)}>
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
 * Bottom navigation for the app screens.
 *
 * Mobile-only by design: this is the phone's primary navigation, while md+
 * keeps the inline links in <AppBar>. Destinations are contextual — inside a
 * roadmap you get that roadmap's three views plus the library; elsewhere you
 * get the top-level three. Never more than five, per the bar's budget.
 *
 * Accessibility: each item is a ≥48px target with an icon *and* a visible
 * label, `aria-current="page"` on the active one, and the active state is
 * carried by a sliding indicator and a heavier icon stroke as well as
 * colour — so it reads without relying on hue.
 */
export function BottomNav() {
  const pathname = usePathname() ?? "";
  const user = useAuthStore((s) => s.user);

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
      className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-line/10 bg-card/85 shadow-e3 backdrop-blur-2xl backdrop-saturate-150 md:hidden"
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
                  "press relative flex h-full min-h-touch flex-col items-center justify-center gap-1 rounded-sm px-1 transition-colors duration-fast",
                  active ? "text-accent-text" : "text-muted"
                )}
              >
                {/* Sliding indicator — a second, non-colour cue for "selected" */}
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    aria-hidden
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent"
                  />
                )}
                <Icon filled={active} />
                <span
                  className={clsx(
                    "text-[0.625rem] leading-none tracking-tight",
                    active ? "font-bold" : "font-medium"
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
