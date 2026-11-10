"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { authSchema, type AuthInput } from "@/lib/authSchemas";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { googleLoginUrl } from "@/hooks/useGoogleCalendar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GeometryShapes } from "@/components/home/GeometryShapes";
import { ActionLink } from "@/components/home/ActionLink";
import { toast } from "@/components/ui/toast";
import { Eyebrow } from "@/components/ui/Eyebrow";

const FEATURE_POINTS = [
  {
    title: "AI-crafted syllabus",
    copy: "Every topic becomes a difficulty-sequenced learning path.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="19" cy="19" r="1.6" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    title: "Freshness-verified",
    copy: "Resources are checked so you never learn from stale links.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3l7 2.6v5.2c0 4.5-3 8.6-7 10.2-4-1.6-7-5.7-7-10.2V5.6L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="m9 12 2 2 4-4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "One stage at a time",
    copy: "Unlock stages as you go, with your progress synced everywhere.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 12V8M15.5 13.5 12 12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5.5" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m4.5 7.5 7.5 6 7.5-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4.5" y="10" width="15" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GoogleMark() {
  // Google's brand mark is the one place a literal colour is correct: the
  // "Sign in with Google" guidelines forbid recolouring it, so these four
  // hexes are the asset, not theming.
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}

/**
 * Sign-in / sign-up — a Material 3 screen.
 *
 * Anatomy: a brand panel on a `surface-container-low` step beside the form on
 * a `surface-container` card, so the two columns read as layers of one surface
 * rather than two glass slabs on black. Fields are M3 **filled text fields**
 * (`ui/Input`, with floating labels, leading icons and its own error row), and
 * the emphasis ladder runs filled submit → outlined Google → text links, which
 * is the one filled button this view is allowed.
 */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthInput>({ resolver: zodResolver(authSchema) });

  const isLogin = mode === "login";
  const [googleLogin, setGoogleLogin] = useState(false);

  // Returned from the Google OAuth callback with auth cookies already set —
  // show a confirmation, then land on the home page. Read from
  // window.location (not useSearchParams) so the auth pages don't need a
  // Suspense boundary for static prerendering.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("googleLogin") !== "1") return;
    setGoogleLogin(true);
    toast.success("Signed in with Google", "Your workspace is ready.");
    const t = setTimeout(() => router.replace("/"), 1600);
    return () => clearTimeout(t);
  }, [router]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await apiClient.post(isLogin ? "/auth/login" : "/auth/register", values);
      if (isLogin) {
        toast.success(
          "Welcome back",
          values.email.split("@")[0]
            ? `Good to see you, ${values.email.split("@")[0]}!`
            : "Good to see you!"
        );
      } else {
        toast.success(
          "Account created",
          "Welcome to Vidhyora — let's build your first roadmap."
        );
      }
      // Wait for auth state to init before navigating
      const { useAuthStore } = await import("@/store/authStore");
      await useAuthStore.getState().initAuth();
      router.push("/");
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Something went wrong";
      setServerError(message);
      toast.error(isLogin ? "Sign-in failed" : "Couldn't create your account", message);
    }
  });

  const stagger = (delay: number) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.55, ease: "easeOut" as const },
        };

  return (
    // `.min-h-screen-safe` (100svh), never `min-h-screen` — 100vh ignores the
    // mobile browser chrome and makes the panel jump as the URL bar collapses.
    <section className="min-h-screen-safe relative z-10 flex items-center justify-center overflow-hidden bg-md-surface py-16 sm:py-20">
      {/* Ambient glows + noise. The vivid brand source carries them; every
          opaque surface below takes an M3 role. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(52rem_36rem_at_12%_-10%,rgb(var(--md-source)/0.14),transparent_60%),radial-gradient(44rem_32rem_at_100%_20%,rgb(var(--md-source)/0.12),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-36 h-[28rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.28),transparent_68%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-44 -left-28 h-[26rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.20),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-36 h-[24rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.16),transparent_70%)] blur-3xl"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.05]" />
      <GeometryShapes variant="hero" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-stretch gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
        {/* ── Brand panel (left) ── */}
        <motion.div
          {...stagger(0.05)}
          className="relative hidden flex-col justify-between overflow-hidden rounded-xl border border-md-outline-variant bg-md-surface-container-low p-10 shadow-e1 lg:flex"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.16),transparent_65%)]"
          />

          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="logo-chip flex h-11 w-11 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/vidhyora-logo.png" alt="" width={44} height={44} className="h-11 w-11" />
              </span>
              <span className="text-headline-sm text-md-on-surface">Vidhyora</span>
            </div>

            <div className="mt-8">
              <Eyebrow className="!tracking-[0.22em]">
                {isLogin ? "Welcome to Vidhyora" : "Start for free"}
              </Eyebrow>
            </div>

            <h2 className="mt-5 text-display-sm leading-[1.14] text-md-on-surface">
              Turn any topic into a <span className="text-md-primary">learning roadmap.</span>
            </h2>
            <p className="mt-4 max-w-sm text-body-lg text-md-on-surface-variant">
              Your AI digital twin for learning — syllabus, resources, certifications,
              practice and a day-by-day timeline, all in one place.
            </p>
          </div>

          {/* Brand scene. This reuses the "how it works" render — there is no
              dedicated login artwork yet, and inventing one would mean shipping
              a different visual language on this screen. */}
          <div aria-hidden data-scene-stage className="relative mt-8 flex-1">
            <Image
              src="/3d/how-header.png"
              alt=""
              width={846}
              height={356}
              sizes="38vw"
              className="mx-auto h-auto w-full max-w-md select-none"
            />
          </div>

          <ul className="relative mt-8 space-y-5">
            {FEATURE_POINTS.map((point) => (
              <li key={point.title} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-md bg-md-primary-container text-md-on-primary-container">
                  {point.icon}
                </span>
                <div>
                  <p className="text-title-sm text-md-on-surface">{point.title}</p>
                  <p className="mt-0.5 text-body-md text-md-on-surface-variant">{point.copy}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="relative mt-8 border-t border-md-outline-variant/60 pt-5 text-body-sm text-md-on-surface-variant">
            {isLogin
              ? "Welcome back — pick up exactly where you left off."
              : "Free to start. Your progress syncs across devices."}
          </p>
        </motion.div>

        {/* ── Form card (right) ── */}
        <motion.div
          {...stagger(0.12)}
          // The card stretches to the brand panel's height so both columns
          // line up. Centring the content vertically keeps the leftover height
          // balanced above and below instead of dumping it all under the
          // submit button.
          className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-md-outline-variant bg-md-surface-container p-6 shadow-e2 sm:p-10"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.12),transparent_65%)]"
          />

          <div className="relative">
            <Eyebrow>{isLogin ? "Welcome back" : "Join Vidhyora"}</Eyebrow>
            {/* Stays an h3 under the brand panel's h2 — the heading order on
                this screen is not mine to renumber. */}
            <h3 className="mt-3 text-headline-md text-md-on-surface sm:text-headline-lg">
              {isLogin ? "Log in to your account." : "Create your account."}
            </h3>
            <p className="mt-3 text-body-lg text-md-on-surface-variant">
              {isLogin ? (
                <>
                  Don’t have an account?{" "}
                  <a
                    href="/auth/register"
                    className="font-medium text-md-primary underline-offset-4 hover:underline"
                  >
                    Create a free one
                  </a>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <a
                    href="/auth/login"
                    className="font-medium text-md-primary underline-offset-4 hover:underline"
                  >
                    Log in
                  </a>
                </>
              )}
            </p>
          </div>

          {googleLogin ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative mt-9 flex flex-col items-center rounded-lg bg-md-primary-container px-4 py-12 text-center text-md-on-primary-container sm:px-6"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-md-primary text-md-on-primary">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="m5 12.5 4.5 4.5L19 7.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p className="mt-5 text-title-lg">Signed in with Google</p>
              <p className="mt-2 text-body-md">Setting up your workspace…</p>
            </motion.div>
          ) : (
            <>
              {/* ── Continue with Google ── */}
              <div className="relative mt-9">
                <ActionLink
                  href={googleLoginUrl("/")}
                  variant="outlined"
                  size="lg"
                  fullWidth
                  icon={<GoogleMark />}
                >
                  Continue with Google
                </ActionLink>

                <div className="my-6 flex items-center gap-3" aria-hidden>
                  <span className="h-px flex-1 bg-md-outline-variant" />
                  <span className="text-label-sm uppercase tracking-[0.22em] text-md-on-surface-variant">
                    or continue with email
                  </span>
                  <span className="h-px flex-1 bg-md-outline-variant" />
                </div>
              </div>

              <form onSubmit={onSubmit} className="relative space-y-5" noValidate>
                <Input
                  id="email"
                  label="Email"
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                  startAdornment={<MailIcon />}
                  error={errors.email?.message}
                  {...register("email")}
                />

                <div>
                  <Input
                    id="password"
                    label="Password"
                    placeholder="Min. 8 characters"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    startAdornment={<LockIcon />}
                    error={errors.password?.message}
                    endAdornment={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        className="press state-layer flex h-touch w-touch items-center justify-center rounded-full text-md-on-surface-variant"
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path
                              d="M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 8.5 4.4 9 7-.2 1.1-1.1 2.9-2.5 4.4M6.3 6.8C4.2 8.3 3 10.4 2.9 12c.5 2.6 4 7 9.1 7 1.3 0 2.5-.2 3.5-.6"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M9.9 9.9a3 3 0 1 0 4.2 4.2"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M2.9 12c.5-2.6 4-7 9.1-7s8.6 4.4 9.1 7c-.5 2.6-4 7-9.1 7s-8.6-4.4-9.1-7Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        )}
                      </button>
                    }
                    {...register("password")}
                  />

                  {isLogin && (
                    <div className="mt-1 flex justify-end">
                      <a
                        href="#"
                        className="-my-2 inline-flex min-h-touch-min items-center px-1 text-body-sm text-md-on-surface-variant transition-colors duration-fast hover:text-md-primary"
                      >
                        Forgot password?
                      </a>
                    </div>
                  )}
                </div>

                {serverError && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="flex items-start gap-2 rounded-sm bg-md-error-container px-4 py-3 text-body-md text-md-on-error-container"
                  >
                    {/* Icon as well as colour — status is never colour alone. */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mt-px flex-none"
                      aria-hidden
                    >
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                      <path
                        d="M12 7.5v5M12 16h.01"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    {serverError}
                  </motion.p>
                )}

                {/* The one filled button on this screen. */}
                <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
                  {isLogin ? "Log in" : "Create my account"}
                </Button>

                <p className="text-center text-body-sm text-md-on-surface-variant">
                  By continuing you agree to Vidhyora&apos;s{" "}
                  <a href="#" className="underline-offset-4 hover:text-md-primary hover:underline">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="underline-offset-4 hover:text-md-primary hover:underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
