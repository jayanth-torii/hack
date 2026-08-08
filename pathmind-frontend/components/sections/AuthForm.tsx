"use client";

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
import { Illustration } from "@/components/ui/Illustration";
import { clsx } from "@/lib/clsx";
import { toast } from "@/components/ui/toast";

const FEATURE_POINTS = [
  {
    title: "AI-crafted syllabus",
    copy: "Every topic becomes a difficulty-sequenced learning path.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="19" cy="19" r="1.6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    title: "Freshness-verified",
    copy: "Resources are checked so you never learn from stale links.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3l7 2.6v5.2c0 4.5-3 8.6-7 10.2-4-1.6-7-5.7-7-10.2V5.6L12 3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="m9 12 2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "One stage at a time",
    copy: "Unlock stages as you go, with your progress synced everywhere.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M12 12V8M15.5 13.5 12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

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
          values.email.split("@")[0] ? `Good to see you, ${values.email.split("@")[0]}!` : "Good to see you!"
        );
      } else {
        toast.success("Account created 🎉", "Welcome to Vidhyora — let's build your first roadmap.");
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
      : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.55, ease: "easeOut" as const } };

  return (
    <section className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden bg-ink py-20">
      {/* Ambient glows + noise */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(52rem_36rem_at_12%_-10%,rgba(201,243,29,0.12),transparent_60%),radial-gradient(44rem_32rem_at_100%_20%,rgba(56,189,248,0.1),transparent_60%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.05]" />
      <GeometryShapes variant="hero" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-stretch gap-10 px-6 lg:grid-cols-2 lg:gap-14">
        {/* ── Brand panel (left) ── */}
        <motion.div
          {...stagger(0.05)}
          className="relative hidden flex-col justify-between overflow-hidden rounded-3xl border border-line/10 bg-card/50 p-10 backdrop-blur-xl lg:flex"
        >
          {/* corner glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(201,243,29,0.16),transparent_65%)]"
          />

          <div className="relative">
            <span className="logo-chip flex h-11 w-11 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/vidhyora-logo.png" alt="" width={44} height={44} className="h-11 w-11" />
            </span>
            <h2 className="mt-8 font-display text-4xl font-semibold leading-[1.15] tracking-tight text-paper">
              Turn any topic into a{" "}
              <span className="text-accent">learning roadmap.</span>
            </h2>
            <p className="mt-4 max-w-sm text-muted">
              Your AI digital twin for learning — syllabus, resources,
              certifications, practice and a day-by-day timeline, all in one place.
            </p>
          </div>

          {/* Brand illustration — recolored scene in a light window frame */}
          <div className="relative mt-10 min-h-44 flex-1">
            <Illustration
              name={isLogin ? "secure-login" : "authentication"}
              className="mx-auto h-44 w-full max-w-sm xl:h-52"
              imgClassName="object-contain p-2"
              glow
            />
          </div>

          <ul className="relative mt-10 space-y-5">
            {FEATURE_POINTS.map((point) => (
              <li key={point.title} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent">
                  {point.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-paper">{point.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{point.copy}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="relative mt-12 border-t border-line/10 pt-6 text-xs text-muted">
            {isLogin ? "Welcome back — pick up exactly where you left off." : "Free to start. Your progress syncs across devices."}
          </p>
        </motion.div>

        {/* ── Form card (right) ── */}
        <motion.div
          {...stagger(0.12)}
          className="relative overflow-hidden rounded-3xl border border-line/10 bg-card/60 p-8 backdrop-blur-xl sm:p-12"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(201,243,29,0.12),transparent_65%)]"
          />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-text">
              {isLogin ? "// Welcome back" : "// Join Vidhyora"}
            </p>
            <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
              {isLogin ? "Log in to your account." : "Create your account."}
            </h3>
            <p className="mt-3 text-muted">
              {isLogin ? (
                <>
                  Don’t have an account?{" "}
                  <a href="/auth/register" className="font-medium text-accent-text transition-colors hover:text-accent">
                    Create a free one
                  </a>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <a href="/auth/login" className="font-medium text-accent-text transition-colors hover:text-accent">
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
              className="relative mt-9 flex flex-col items-center rounded-2xl border border-accent/25 bg-accent/10 px-6 py-12 text-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-accent">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="mt-5 font-display text-xl font-semibold text-paper">
                Signed in with Google
              </p>
              <p className="mt-2 text-sm text-muted">Setting up your workspace…</p>
            </motion.div>
          ) : (
            <>
              {/* ── Continue with Google ── */}
              <div className="relative mt-9">
                <a
                  href={googleLoginUrl("/")}
                  className="group flex w-full items-center justify-center gap-3 rounded-full border border-line/15 bg-card/60 py-3.5 text-sm font-semibold text-paper backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card hover:shadow-lg hover:shadow-accent/10 active:translate-y-0"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
                    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
                  </svg>
                  Continue with Google
                </a>

                <div className="my-6 flex items-center gap-3" aria-hidden>
                  <span className="h-px flex-1 bg-line/15" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted">
                    or continue with email
                  </span>
                  <span className="h-px flex-1 bg-line/15" />
                </div>
              </div>

              <form onSubmit={onSubmit} className="relative space-y-6" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-subtle">
                Email
              </label>
              <div className="relative">
                <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5.5" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.6" />
                    <path d="m4.5 7.5 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <Input
                  id="email"
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                  className="w-full border-line/10 bg-ink/50 py-3.5 pl-11 text-paper placeholder:text-muted focus-visible:border-accent/60 focus-visible:ring-accent/30"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-subtle">
                  Password
                </label>
                {isLogin && (
                  <a href="#" className="text-xs text-muted transition-colors hover:text-accent-text">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="4.5" y="10" width="15" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
                <Input
                  id="password"
                  placeholder="Min. 8 characters"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="w-full border-line/10 bg-ink/50 py-3.5 pl-11 pr-11 text-paper placeholder:text-muted focus-visible:border-accent/60 focus-visible:ring-accent/30"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted transition-colors hover:text-accent-text"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 8.5 4.4 9 7-.2 1.1-1.1 2.9-2.5 4.4M6.3 6.8C4.2 8.3 3 10.4 2.9 12c.5 2.6 4 7 9.1 7 1.3 0 2.5-.2 3.5-.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M9.9 9.9a3 3 0 1 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M2.9 12c.5-2.6 4-7 9.1-7s8.6 4.4 9.1 7c-.5 2.6-4 7-9.1 7s-8.6-4.4-9.1-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
            </div>

            {serverError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300"
              >
                {serverError}
              </motion.p>
            )}

            <Button
              type="submit"
              isLoading={isSubmitting}
              className={clsx(
                "w-full rounded-full bg-accent py-4 text-base font-bold tracking-tight text-on-accent transition-all hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/25"
              )}
            >
              {isLogin ? "Log in" : "Create my account"}
            </Button>

            <p className="text-center text-xs text-muted">
              By continuing you agree to Vidhyora&apos;s{" "}
              <a href="#" className="underline-offset-2 hover:text-accent-text hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="underline-offset-2 hover:text-accent-text hover:underline">
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
