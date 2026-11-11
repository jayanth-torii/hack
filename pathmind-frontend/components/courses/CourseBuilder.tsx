"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  useBuildCourse,
  useCatalog,
  useCatalogCategories,
  useCourseDetail,
} from "@/hooks/useCatalogQuery";
import { MdButton } from "@/components/md/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { StateView } from "@/components/ui/StateView";
import { toast } from "@/components/ui/toast";
import { confirm } from "@/components/ui/ConfirmDialog";
import { clsx } from "@/lib/clsx";
import type { BuilderPick, CatalogCourse, CourseLevel } from "@/types/catalog";
import { ClockIcon, LayersIcon, PlusIcon, CheckIcon } from "@/components/profile/ProfileIcons";

const MAX_STAGES = 20;

const LEVEL_TONE: Record<CourseLevel, "success" | "brand" | "warning"> = {
  beginner: "success",
  intermediate: "brand",
  advanced: "warning",
};

const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon({ up }: { up?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={up ? "M12 19V5m0 0-6 6m6-6 6 6" : "M12 5v14m0 0 6-6m-6 6-6-6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A square icon button on the 48px grid, for the row controls. */
function IconButton({
  label,
  onClick,
  disabled,
  tone = "neutral",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={clsx(
        "state-layer press grid h-11 w-11 flex-none place-items-center rounded-full",
        "transition-colors duration-fast ease-standard",
        tone === "danger" ? "text-md-error" : "text-md-on-surface-variant",
        "disabled:pointer-events-none disabled:text-md-on-surface/[0.38]"
      )}
    >
      {children}
    </button>
  );
}

/**
 * The stage picker for one catalog course.
 *
 * Collapsed by default and fetched only when expanded: the builder lists the
 * whole catalog, and eagerly loading every course's syllabus would pull the
 * entire corpus down to render a list of titles.
 */
function CourseStagePicker({
  course,
  picked,
  onToggle,
  atLimit,
}: {
  course: CatalogCourse;
  picked: Set<string>;
  onToggle: (course: CatalogCourse, stage: { _id: string; title: string; difficulty: CourseLevel; estimatedDays: number; syllabus: string[] }) => void;
  atLimit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const detail = useCourseDetail(open ? course.id : null);
  const stages = detail.data?.course.stages ?? [];
  const pickedHere = stages.filter((s) => picked.has(s._id)).length;

  return (
    <li className="min-w-0 rounded-md border border-md-outline-variant bg-md-surface-container-low">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="state-layer press flex min-h-touch w-full items-center gap-3 rounded-md p-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-title-sm text-md-on-surface">{course.topic}</span>
          <span className="mt-1 block text-body-sm text-md-on-surface-variant">
            {course.stageCount} stages · {course.category ?? "Uncategorised"}
            {pickedHere > 0 ? ` · ${pickedHere} picked` : ""}
          </span>
        </span>
        <span
          aria-hidden
          className={clsx(
            "flex-none text-md-on-surface-variant transition-transform duration-base ease-standard",
            open && "rotate-180"
          )}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="m6 9 6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="border-t border-md-outline-variant p-3">
          {detail.isLoading && (
            <div role="status" aria-live="polite" aria-busy="true" className="space-y-2">
              <span className="sr-only">Loading stages</span>
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-sm" />
              ))}
            </div>
          )}

          {detail.isError && (
            <p role="alert" className="px-1 py-2 text-body-sm text-md-error">
              This course&rsquo;s stages could not be loaded. Try opening it again.
            </p>
          )}

          {!detail.isLoading && !detail.isError && (
            <ul className="space-y-2">
              {stages.map((stage) => {
                const isPicked = picked.has(stage._id);
                const blocked = !isPicked && atLimit;
                return (
                  <li key={stage._id}>
                    <button
                      type="button"
                      onClick={() => onToggle(course, stage)}
                      disabled={blocked}
                      aria-pressed={isPicked}
                      className={clsx(
                        "state-layer press flex w-full min-w-0 items-start gap-3 rounded-sm border p-3 text-left",
                        "transition-[border-color,background-color] duration-fast ease-standard",
                        isPicked
                          ? "border-md-primary bg-md-primary-container/40"
                          : "border-md-outline-variant",
                        blocked && "pointer-events-none opacity-50"
                      )}
                    >
                      <span
                        aria-hidden
                        className={clsx(
                          "mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-sm border",
                          isPicked
                            ? "border-md-primary bg-md-primary text-md-on-primary"
                            : "border-md-outline text-transparent"
                        )}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-lg text-md-on-surface">{stage.title}</span>
                        <span className="mt-1 block text-body-sm text-md-on-surface-variant">
                          {LEVEL_LABEL[stage.difficulty]} · {stage.estimatedDays} day
                          {stage.estimatedDays === 1 ? "" : "s"} · {stage.syllabus.length} topics
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Build a personal course by picking stages out of published courses.
 *
 * The non-AI path to a roadmap. Nothing here is generated: every stage is
 * copied from a curated course whose resources were already checked, so the
 * result is exactly as trustworthy as the catalog — and building one costs no
 * model call and no generation rate-limit budget.
 *
 * Order is the learner's. The server rebuilds the prerequisite chain from the
 * order given, so the list below genuinely is the sequence the stages will
 * unlock in.
 */
export function CourseBuilder() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  const [title, setTitle] = useState("");
  const [picks, setPicks] = useState<BuilderPick[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const categories = useCatalogCategories();
  const catalog = useCatalog({
    q: search.trim() || undefined,
    category: category ?? undefined,
    sort: "alphabetical",
    limit: 48,
    page: 1,
  });
  const build = useBuildCourse();

  const pickedIds = useMemo(() => new Set(picks.map((p) => p.stageId)), [picks]);
  const totalDays = picks.reduce((n, p) => n + p.estimatedDays, 0);
  const atLimit = picks.length >= MAX_STAGES;

  const titleError =
    submitted && title.trim().length < 3 ? "Give your course a name of at least 3 characters" : undefined;

  /**
   * Warns before a reload or tab close discards an unsaved build.
   *
   * The picks live only in component state, so without this a stray refresh
   * silently throws away a sequence that may have taken real effort to
   * assemble. Registered only while there is something to lose.
   */
  useEffect(() => {
    if (picks.length === 0 && title.trim() === "") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [picks.length, title]);

  function toggleStage(
    course: CatalogCourse,
    stage: { _id: string; title: string; difficulty: CourseLevel; estimatedDays: number; syllabus: string[] }
  ) {
    setPicks((current) => {
      const existing = current.findIndex((p) => p.stageId === stage._id);
      if (existing >= 0) return current.filter((_, i) => i !== existing);
      if (current.length >= MAX_STAGES) return current;
      return [
        ...current,
        {
          courseId: course.id,
          courseTopic: course.topic,
          stageId: stage._id,
          title: stage.title,
          difficulty: stage.difficulty,
          estimatedDays: stage.estimatedDays,
          syllabusCount: stage.syllabus.length,
        },
      ];
    });
  }

  function move(index: number, delta: number) {
    setPicks((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  async function handleClear() {
    const ok = await confirm({
      title: "Clear this course?",
      message: `All ${picks.length} picked stage${picks.length === 1 ? "" : "s"} will be removed. This cannot be undone.`,
      confirmLabel: "Clear",
      tone: "danger",
    });
    if (ok) setPicks([]);
  }

  async function handleBuild() {
    setSubmitted(true);
    if (title.trim().length < 3 || picks.length === 0) return;

    try {
      const roadmap = await build.mutateAsync({
        title: title.trim(),
        stages: picks.map((p) => ({ courseId: p.courseId, stageId: p.stageId })),
      });
      toast.success(`"${roadmap.topic}" is ready`, "It is already in your library.");
      // Clear first: the unload guard above must not fire on the navigation
      // that follows a successful build.
      setPicks([]);
      setTitle("");
      router.push(`/roadmap/${roadmap.id}`);
    } catch {
      toast.error(
        "The course could not be built",
        "One of the stages may no longer be published. Try removing it and building again."
      );
    }
  }

  if (!isInitializing && !user) {
    return (
      <StateView
        title="Sign in to build a course"
        description="A built course goes straight into your library, so it needs an account to belong to. Browsing the catalog does not."
        primary={{ label: "Sign in", href: `/auth/login?next=${encodeURIComponent("/courses/build")}` }}
        secondary={{ label: "Browse the catalog", href: "/courses" }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="min-w-0">
        <Link
          href="/courses"
          className="-my-2.5 inline-flex min-h-touch-min items-center gap-1.5 py-2.5 text-label-lg text-md-on-surface-variant transition-colors duration-fast hover:text-md-primary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M19 12H5m0 0 6.5-6.5M5 12l6.5 6.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Course catalog
        </Link>
        <h1 className="mt-3 text-headline-md text-md-on-surface sm:text-display-sm">
          Build your own course
        </h1>
        <p className="mt-3 max-w-2xl text-body-lg text-md-on-surface-variant">
          Pick stages from any published course and put them in the order you want to learn them.
          Nothing is generated — every stage keeps the curated syllabus and checked resources it
          came with.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* ── Picker ─────────────────────────────────────────────── */}
        <section aria-labelledby="picker-heading" className="min-w-0 lg:col-span-3">
          <h2 id="picker-heading" className="text-title-lg text-md-on-surface">
            1. Choose stages
          </h2>

          <div className="mt-4 space-y-3">
            <Input
              label="Search courses"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              autoComplete="off"
            />

            <div
              className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-1 lg:px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Filter by subject"
            >
              <button
                type="button"
                onClick={() => setCategory(null)}
                aria-pressed={category === null}
                className={clsx(
                  "state-layer press min-h-touch-min flex-none snap-start rounded-sm border px-4 text-label-lg",
                  category === null
                    ? "border-transparent bg-md-secondary-container text-md-on-secondary-container"
                    : "border-md-outline text-md-on-surface-variant"
                )}
              >
                All
              </button>
              {(categories.data ?? []).map((c) => (
                <button
                  key={c.category}
                  type="button"
                  onClick={() => setCategory(category === c.category ? null : c.category)}
                  aria-pressed={category === c.category}
                  className={clsx(
                    "state-layer press min-h-touch-min flex-none snap-start rounded-sm border px-4 text-label-lg",
                    category === c.category
                      ? "border-transparent bg-md-secondary-container text-md-on-secondary-container"
                      : "border-md-outline text-md-on-surface-variant"
                  )}
                >
                  {c.category}
                </button>
              ))}
            </div>
          </div>

          {atLimit && (
            <p
              role="status"
              className="mt-4 rounded-md bg-md-warning-container p-3 text-body-sm text-md-on-warning-container"
            >
              You have reached the {MAX_STAGES}-stage limit. Remove a stage to add a different one.
            </p>
          )}

          <div className="mt-4">
            {catalog.isLoading ? (
              <div role="status" aria-live="polite" aria-busy="true" className="space-y-2">
                <span className="sr-only">Loading courses</span>
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-[4.5rem] w-full rounded-md" />
                ))}
              </div>
            ) : catalog.isError ? (
              <StateView
                tone="error"
                title="Courses could not be loaded"
                description="The catalog is unreachable right now. Anything you have already picked is still here."
                primary={{ label: "Try again", onClick: () => void catalog.refetch() }}
              />
            ) : (catalog.data?.courses.length ?? 0) === 0 ? (
              <StateView
                title="No courses match"
                description="Try a different search term, or clear the subject filter."
                primary={{
                  label: "Clear filters",
                  onClick: () => {
                    setSearch("");
                    setCategory(null);
                  },
                }}
              />
            ) : (
              <ul className="space-y-2">
                {(catalog.data?.courses ?? []).map((course) => (
                  <CourseStagePicker
                    key={course.id}
                    course={course}
                    picked={pickedIds}
                    onToggle={toggleStage}
                    atLimit={atLimit}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Assembled course ───────────────────────────────────── */}
        <section aria-labelledby="build-heading" className="min-w-0 lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <h2 id="build-heading" className="text-title-lg text-md-on-surface">
              2. Name and order it
            </h2>

            <div className="mt-4 rounded-md border border-md-outline-variant bg-md-surface-container p-4">
              <Input
                label="Course name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={titleError}
                required
                maxLength={80}
                helperText={titleError ? undefined : "For example: Backend fundamentals"}
              />

              <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-md-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Stages picked</dt>
                  <LayersIcon className="h-4 w-4" />
                  <dd>
                    {picks.length} / {MAX_STAGES} stages
                  </dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Estimated length</dt>
                  <ClockIcon className="h-4 w-4" />
                  <dd>{totalDays} days</dd>
                </div>
              </dl>

              {picks.length === 0 ? (
                <p className="mt-4 rounded-sm border border-dashed border-md-outline-variant p-4 text-body-md text-md-on-surface-variant">
                  No stages yet. Open a course on the left and tap the stages you want — they will
                  appear here in the order you pick them.
                </p>
              ) : (
                <ol className="mt-4 space-y-2">
                  {picks.map((pick, index) => (
                    <li
                      key={`${pick.stageId}-${index}`}
                      className="flex min-w-0 items-start gap-2 rounded-sm bg-md-surface-container-high p-3"
                    >
                      <span
                        aria-hidden
                        className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-md-secondary-container text-label-md text-md-on-secondary-container"
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-lg text-md-on-surface">{pick.title}</span>
                        <span className="mt-0.5 block truncate text-body-sm text-md-on-surface-variant">
                          {pick.courseTopic}
                        </span>
                        <span className="mt-1.5 inline-flex">
                          <Badge tone={LEVEL_TONE[pick.difficulty]}>
                            {LEVEL_LABEL[pick.difficulty]}
                          </Badge>
                        </span>
                      </span>
                      <span className="flex flex-none flex-col">
                        <IconButton
                          label={`Move "${pick.title}" earlier`}
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                        >
                          <ArrowIcon up />
                        </IconButton>
                        <IconButton
                          label={`Move "${pick.title}" later`}
                          onClick={() => move(index, 1)}
                          disabled={index === picks.length - 1}
                        >
                          <ArrowIcon />
                        </IconButton>
                        <IconButton
                          label={`Remove "${pick.title}"`}
                          tone="danger"
                          onClick={() =>
                            setPicks((current) => current.filter((_, i) => i !== index))
                          }
                        >
                          <TrashIcon />
                        </IconButton>
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              <div className="mt-5 flex flex-col gap-2">
                <MdButton
                  variant="filled"
                  icon={<PlusIcon />}
                  fullWidth
                  disabled={build.isPending || picks.length === 0}
                  onClick={handleBuild}
                >
                  {build.isPending ? "Building…" : "Build and start"}
                </MdButton>
                {picks.length > 0 && (
                  <MdButton variant="text" fullWidth onClick={handleClear}>
                    Clear all
                  </MdButton>
                )}
              </div>

              {submitted && picks.length === 0 && (
                <p role="alert" className="mt-3 text-body-sm text-md-error">
                  Pick at least one stage before building.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
