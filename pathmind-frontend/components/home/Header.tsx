"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { clsx } from "@/lib/clsx";
import { ThemeToggle } from "./ThemeToggle";
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
 * Fixed glassy header: a translucent frosted surface (backdrop blur +
 * saturation boost) with a hairline bottom border and a subtle lime top
 * shine. Fully theme-aware — frosted dark glass at night, frosted white
 * glass in light mode. Includes the sun/moon theme toggle.
 *
 * Auth-aware: signed-in users see an avatar chip (initial + email) linking
 * to /profile plus a Log out action; signed-out visitors see Log in and
 * Get started.
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
    toast.success("Signed out", "See you soon! 👋");
  };

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 border-b border-line/10 bg-card/60 backdrop-blur-2xl backdrop-saturate-150"
    >
      {/* Glass top shine */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
      />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Vidhyora home">
          {/* Dark rounded chip keeps the black-bg logo seamless in both themes */}
          <span className="logo-chip flex h-9 w-9 items-center justify-center transition-transform duration-300 group-hover:scale-110">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vidhyora-logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9"
            />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-paper">
            Vidhyora
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-subtle transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="group flex items-center gap-2.5 rounded-full border border-line/15 bg-card/50 py-1.5 pl-1.5 pr-4 backdrop-blur-md transition-colors hover:border-accent/60"
                  aria-label="Open your profile"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">
                    {initial}
                  </span>
                  <span className="max-w-[11rem] truncate text-sm text-subtle group-hover:text-accent">
                    {user.email}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-full px-3 py-2 text-sm text-subtle transition-colors hover:text-accent"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-full px-4 py-2 text-sm text-subtle transition-colors hover:text-accent"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold tracking-tight text-on-accent shadow-lg shadow-accent/25 transition-colors hover:bg-accent-hover"
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
            aria-label="Toggle menu"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          >
            <span className={clsx("h-0.5 w-5 bg-paper transition-transform", open && "translate-y-2 rotate-45")} />
            <span className={clsx("h-0.5 w-5 bg-paper transition-opacity", open && "opacity-0")} />
            <span className={clsx("h-0.5 w-5 bg-paper transition-transform", open && "-translate-y-2 -rotate-45")} />
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="border-t border-line/10 bg-card/70 px-6 py-4 backdrop-blur-2xl md:hidden"
        >
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-subtle hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="text-sm text-subtle hover:text-accent"
              >
                Profile
              </Link>
            )}
            <div className="mt-2 flex gap-3">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void handleLogout();
                  }}
                  className="flex-1 rounded-full bg-accent px-4 py-2 text-center text-sm font-bold tracking-tight text-on-accent"
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full border border-line/15 px-4 py-2 text-center text-sm text-subtle"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full bg-accent px-4 py-2 text-center text-sm font-bold tracking-tight text-on-accent"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
