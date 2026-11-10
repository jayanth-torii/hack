"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { clsx } from "@/lib/clsx";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import { useAuthStore } from "@/store/authStore";
import { confirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#stats", label: "Stats" },
  { href: "/saved", label: "Saved roadmaps" },
];

/**
 * Marketing header — a Material 3 top app bar for the public site.
 *
 * 64dp tall (`--app-bar-h`), drawn on `surface` with the frosted treatment the
 * landing page relies on (backdrop blur + saturation boost) so the hero shows
 * through, with a hairline `outline-variant` bottom edge. Destinations and
 * account controls are M3 text/filled buttons with state layers rather than
 * hover colour swaps.
 *
 * Auth-aware: signed-in users see an avatar chip (initial + email) linking
 * to /profile plus a Log out action; signed-out visitors see Log in and
 * Get started.
 *
 * The `backdrop-filter` here makes the header a containing block for
 * `position: fixed` descendants, which is why <MobileMenu> portals itself to
 * `document.body` — anything fixed rendered in place would size to this bar.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const initial = user?.email?.charAt(0).toUpperCase() ?? "V";

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign out of Vidhyora?",
      message: "Your roadmaps and progress are saved — you can pick up right where you left off.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay signed in",
      tone: "danger",
    });
    if (!ok) return;
    await logout();
    toast.success("Signed out", "See you soon.");
  };

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="pt-safe fixed inset-x-0 top-0 z-50 border-b border-md-outline-variant/40 bg-md-surface/70 backdrop-blur-2xl backdrop-saturate-150"
    >
      <div className="mx-auto flex h-app-bar max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="state-layer group flex min-h-touch items-center gap-2.5 rounded-full pr-2"
          aria-label="Vidhyora home"
        >
          {/* Dark rounded chip keeps the black-bg logo seamless in both themes */}
          <span className="logo-chip flex h-9 w-9 items-center justify-center transition-transform duration-base ease-standard group-hover:scale-110">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vidhyora-logo.png" alt="" width={36} height={36} className="h-9 w-9" />
          </span>
          <span className="text-title-lg font-medium text-md-on-surface">Vidhyora</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="press state-layer flex min-h-touch items-center rounded-full px-4 text-label-lg text-md-on-surface-variant"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="hidden items-center gap-1 md:flex">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="state-layer flex min-h-touch items-center gap-2.5 rounded-full border border-md-outline-variant py-1.5 pl-1.5 pr-4"
                  aria-label="Open your profile"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-md-primary text-label-lg text-md-on-primary">
                    {initial}
                  </span>
                  <span className="max-w-[11rem] truncate text-label-lg text-md-on-surface-variant">
                    {user.email}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="press state-layer flex min-h-touch items-center rounded-full px-4 text-label-lg text-md-on-surface-variant"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="press state-layer flex min-h-touch items-center rounded-full px-4 text-label-lg text-md-on-surface-variant"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="press state-layer flex min-h-touch items-center rounded-full bg-md-primary px-6 text-label-lg text-md-on-primary shadow-e1"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="press state-layer -mr-1 flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-full text-md-on-surface md:hidden"
          >
            <span
              className={clsx(
                "h-0.5 w-5 bg-md-on-surface transition-transform duration-fast ease-standard",
                open && "translate-y-2 rotate-45"
              )}
            />
            <span
              className={clsx(
                "h-0.5 w-5 bg-md-on-surface transition-opacity duration-fast ease-standard",
                open && "opacity-0"
              )}
            />
            <span
              className={clsx(
                "h-0.5 w-5 bg-md-on-surface transition-transform duration-fast ease-standard",
                open && "-translate-y-2 -rotate-45"
              )}
            />
          </button>
        </div>
      </div>

      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        links={NAV_LINKS}
        user={user ? { email: user.email } : null}
        onLogout={() => void handleLogout()}
      />
    </motion.header>
  );
}
