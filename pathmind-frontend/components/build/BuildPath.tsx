"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { topicSearchSchema, type TopicSearchInput } from "@/lib/zod-schemas";
import { useGenerateRoadmap } from "@/hooks/useRoadmapQuery";
import { useCatalog, useCatalogCategories } from "@/hooks/useCatalogQuery";
import { Chip, ChipRow } from "@/components/ui/FilterChips";
import { ApiClientError } from "@/lib/api-client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Illustration } from "@/components/ui/Illustration";
import { Reveal } from "@/components/home/Reveal";
import { toast } from "@/components/ui/toast";
import { clsx } from "@/lib/clsx";

/**
 * Shown while the catalog is still loading, and if it can't be reached.
 *
 * Suggestions are drawn from the real catalog so a chosen subject offers
 * topics that actually exist, but the field must never sit there with nothing
 * to click because a request is in flight or failed — these are the floor.
 */
const FALLBACK_TOPICS = [
  "Dynamic Programming",
  "React",
  "System Design",
  "Machine Learning",
  "Rust",
  "Kubernetes",
];

/** How many topic suggestions to show under the subject chips. */
const SUGGESTION_LIMIT = 12;

/**
 * The steps the backend actually walks on a generate call, in order.
 *
 * These are **narration, not telemetry** — the endpoint returns once, with no
 * progress stream, so the UI cannot claim to know which step is running. They
 * advance on a timer and the last one holds until the real response lands,
 * which is why the final step is open-ended ("Checking every link") rather
 * than a percentage that would have to lie to reach 100.
 */
const STEPS = [
  { label: "Reading your topic", detail: "Working out scope and prerequisites" },
  { label: "Sequencing stages", detail: "Beginner through advanced, theory beside practice" },
  { label: "Gathering resources", detail: "Docs, videos and practice problems per stage" },
  { label: "Checking every link", detail: "Dead links are dropped before you ever see them" },
];

const STEP_MS = 2600;

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.3l-1.9-5.5L4.5 10.9 10.1 9 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Progress narration shown while the roadmap is being generated.
 *
 * Under reduced motion the steps still advance — the information is the point
 * — but nothing spins or pulses.
 */
function GenerationProgress({ step }: { step: number }) {
  const reduce = useReducedMotion();

  return (
    <ol className="mt-8 space-y-3" aria-live="polite">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li
            key={s.label}
            className={clsx(
              "flex items-start gap-3 rounded-lg border p-4 transition-colors duration-base ease-standard",
              active
                ? "border-md-primary/50 bg-md-primary-container/25"
                : done
                  ? "border-md-outline-variant bg-md-surface-container-low"
                  : "border-md-outline-variant/50 bg-transparent opacity-55"
            )}
          >
            <span
              className={clsx(
                "mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full",
                done
                  ? "bg-md-primary text-md-on-primary"
                  : active
                    ? "bg-md-primary/20 text-md-primary"
                    : "bg-md-surface-container-high text-md-on-surface-variant"
              )}
            >
              {done ? (
                <CheckIcon />
              ) : active && !reduce ? (
                <motion.span
                  className="h-2.5 w-2.5 rounded-full bg-current"
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-current" />
              )}
            </span>
            <span className="min-w-0">
              <span
                className={clsx(
                  "block text-label-lg",
                  active || done ? "text-md-on-surface" : "text-md-on-surface-variant"
                )}
              >
                {s.label}
              </span>
              <span className="mt-0.5 block text-body-sm text-md-on-surface-variant">
                {s.detail}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * `/build` — the dedicated page behind "Build my path".
 *
 * The CTA used to generate inline from the landing hero: the button showed a
 * spinner for as long as the whole pipeline took, with the page still showing
 * marketing copy and no way to tell whether anything was happening. A
 * multi-second, multi-stage operation deserves a destination, which is what
 * this is — the topic, what is being done with it, and the result.
 */
export function BuildPath() {
  const router = useRouter();
  const params = useSearchParams();
  const generate = useGenerateRoadmap();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string | null>(null);

  const categories = useCatalogCategories();
  const suggestions = useCatalog({
    category: category ?? undefined,
    sort: "popular",
    limit: SUGGESTION_LIMIT,
  });

  // Catalog topics for the chosen subject, with the static list as the floor
  // so the row is never empty mid-request or after a failure.
  const topics = useMemo(() => {
    const fromCatalog = (suggestions.data?.courses ?? []).map((c) => c.topic);
    return fromCatalog.length > 0 ? fromCatalog : FALLBACK_TOPICS;
  }, [suggestions.data]);
  // Guards the prefill-autosubmit so a re-render can never fire a second
  // generate for the same handoff.
  const started = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TopicSearchInput>({
    resolver: zodResolver(topicSearchSchema),
    defaultValues: { topic: params.get("topic") ?? "" },
  });

  const topic = watch("topic");
  const pending = generate.isPending;

  // Walk the narration while the request is in flight, holding on the last
  // step rather than completing it — only the response can do that.
  useEffect(() => {
    if (!pending) {
      setStep(0);
      return;
    }
    const timer = window.setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [pending]);

  const run = handleSubmit(async ({ topic: value }) => {
    try {
      const roadmap = await generate.mutateAsync(value);
      toast.success(
        "Roadmap ready",
        `${roadmap.stages.length} stages mapped — start whenever you like.`
      );
      router.push(`/roadmap/${roadmap.id}`);
    } catch (err) {
      toast.error(
        "Couldn't build your path",
        err instanceof ApiClientError ? err.message : "Please try again in a moment."
      );
    }
  });

  // Arriving from the landing CTA with ?topic= means the user already pressed
  // "Build my path" — asking them to press it again would be a dead click.
  useEffect(() => {
    const prefill = params.get("topic")?.trim();
    if (!prefill || started.current) return;
    started.current = true;
    void run();
    // `run` is recreated every render by handleSubmit; depending on it here
    // would re-fire the effect rather than guard it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <section className="relative overflow-hidden bg-md-surface pb-24 pt-10 sm:pb-28 sm:pt-14">
      {/* Corner light, carried by the vivid brand source — the same treatment
          the landing sections use. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-32 h-[30rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.26),transparent_68%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-[26rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.18),transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-10">
          {/* ── Left: the ask ──────────────────────────────────────────── */}
          <Reveal className="lg:col-span-7">
            <Eyebrow>Build your path</Eyebrow>

            <h1 className="mt-5 text-headline-md leading-[1.2] text-md-on-surface sm:text-headline-lg sm:leading-[1.18] xl:text-display-sm xl:leading-[1.16]">
              Name a topic.
              <br />
              Get a <span className="text-md-primary">sequenced</span> plan.
            </h1>

            <p className="mt-6 max-w-lg text-body-lg text-md-on-surface-variant">
              Five to eight stages, ordered beginner to advanced, each with free
              resources and practice problems. Every link is checked before it
              reaches you.
            </p>

            <form onSubmit={run} className="mt-9 max-w-xl">
              <div className="flex flex-col gap-3 rounded-lg border border-md-outline-variant bg-md-surface-container-high p-2 transition-colors duration-fast ease-standard focus-within:border-md-primary sm:flex-row sm:items-center sm:rounded-xl">
                <Input
                  aria-label="Topic"
                  placeholder="e.g. Dynamic Programming, React, Kubernetes"
                  disabled={pending}
                  className="min-h-touch rounded-sm border-0 bg-transparent px-4 text-md-on-surface placeholder:text-md-on-surface-variant"
                  {...register("topic")}
                />
                <Button
                  type="submit"
                  variant="accent"
                  isLoading={pending}
                  disabled={pending || topic.trim().length < 3}
                  className="w-full shrink-0 px-7 sm:w-auto"
                >
                  {pending ? "Building…" : "Build my path"}
                </Button>
              </div>

              {errors.topic && (
                <p role="alert" className="mt-2 px-4 text-body-sm text-md-error">
                  {errors.topic.message}
                </p>
              )}
            </form>

            {pending ? (
              <GenerationProgress step={step} />
            ) : (
              <div className="mt-8">
                <p className="text-label-lg text-md-on-surface-variant">
                  Or start from one of these
                </p>

                {/* Subject chips, straight from the catalog — the same control
                    the catalog screen uses, so "Data & AI" means the same
                    thing and reads the same way in both places. */}
                <div className="mt-3">
                  <ChipRow label="Subject" wrap>
                    <Chip selected={category === null} onClick={() => setCategory(null)}>
                      All
                    </Chip>
                    {(categories.data ?? []).map((c) => (
                      <Chip
                        key={c.category}
                        selected={category === c.category}
                        onClick={() =>
                          setCategory(category === c.category ? null : c.category)
                        }
                      >
                        {c.category}
                      </Chip>
                    ))}
                  </ChipRow>
                </div>

                <div
                  aria-live="polite"
                  className={clsx(
                    "mt-4 flex flex-wrap gap-2 transition-opacity duration-fast",
                    suggestions.isFetching && "opacity-60"
                  )}
                >
                  {topics.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setValue("topic", t, { shouldValidate: true })}
                      className="press state-layer inline-flex min-h-touch-min items-center justify-center rounded-sm border border-md-outline-variant bg-md-surface-container-low px-4 text-left text-label-lg text-md-on-surface-variant transition-colors duration-fast ease-standard"
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <p className="mt-8 flex items-center gap-2 text-body-sm text-md-on-surface-variant">
                  <span className="text-md-primary">
                    <SparkIcon />
                  </span>
                  Prefer to choose the stages yourself?{" "}
                  <a
                    href="/courses/build"
                    className="rounded-sm text-md-primary underline-offset-4 hover:underline"
                  >
                    Assemble one from the catalog
                  </a>
                </p>
              </div>
            )}
          </Reveal>

          {/* ── Right: brand art ───────────────────────────────────────── */}
          <Reveal className="lg:col-span-5" y={24}>
            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <Illustration name="generate" glow alt="" className="mx-auto w-full max-w-md" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
