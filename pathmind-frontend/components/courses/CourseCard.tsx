"use client";

import { MdButton } from "@/components/md/Button";
import { Badge } from "@/components/ui/Badge";
import { clsx } from "@/lib/clsx";
import type { CatalogCourse, CourseLevel } from "@/types/catalog";
import { CheckIcon, ClockIcon, LayersIcon, PlusIcon, TargetIcon } from "@/components/profile/ProfileIcons";

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

/**
 * The difficulty **span**, as a Material assist chip — "Beginner → Advanced",
 * not a single level.
 *
 * Every course in this catalog climbs from beginner to advanced, so labelling
 * a card with the level it *reaches* stamped "Advanced" on all 80 of them,
 * including ones whose first two stages are explicitly beginner work. The span
 * is both truthful and the thing a learner is actually asking: where does this
 * start, and how far does it take me.
 *
 * The tone comes from the **entry** level, because that is what answers "can I
 * start this?" — and the words are always present, so the chip reads the same
 * in greyscale (CLAUDE.md §6).
 */
function levelSpan(difficulties: CourseLevel[]): { label: string; tone: "success" | "brand" | "warning" } {
  const first = difficulties[0] ?? "beginner";
  const last = difficulties[difficulties.length - 1] ?? first;
  return {
    label: first === last ? LEVEL_LABEL[first] : `${LEVEL_LABEL[first]} → ${LEVEL_LABEL[last]}`,
    tone: LEVEL_TONE[first],
  };
}

interface CourseCardProps {
  course: CatalogCourse;
  /** Opens the full-screen preview. */
  onPreview: (course: CatalogCourse) => void;
  onAdd: (course: CatalogCourse) => void;
  /** True while this specific card's add request is in flight. */
  adding?: boolean;
  /** Signed-out visitors get a "sign in to add" affordance instead. */
  signedIn: boolean;
}

/**
 * One course in the catalog grid, as a Material 3 **outlined card**.
 *
 * The whole card is a button that opens the preview, with the "Add" control
 * nested beside it rather than inside it — a button inside a button is invalid
 * HTML and, in practice, swallows the inner click. The card surface is
 * therefore a sibling overlay (`absolute inset-0`) under the controls, which
 * keeps one large touch target for the common action while leaving the add
 * button its own.
 */
export function CourseCard({ course, onPreview, onAdd, adding, signedIn }: CourseCardProps) {
  const weeks = Math.max(1, Math.round(course.totalDays / 7));
  const span = levelSpan(course.difficulties);

  return (
    <article
      className={clsx(
        "group relative flex min-w-0 flex-col rounded-md border bg-md-surface-container-low p-4 sm:p-5",
        "transition-[border-color,box-shadow] duration-base ease-standard",
        course.saved
          ? "border-md-primary/60"
          : "border-md-outline-variant hover:border-md-outline"
      )}
    >
      {/* The card-wide target. Rendered first and positioned behind the
          controls so it never intercepts their taps. */}
      <button
        type="button"
        onClick={() => onPreview(course)}
        className="absolute inset-0 z-0 rounded-md"
        aria-label={`Preview ${course.topic}`}
      />

      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={span.tone}>{span.label}</Badge>
          {course.category && (
            <span className="truncate text-label-md text-md-on-surface-variant">
              {course.category}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-title-md text-md-on-surface">{course.topic}</h3>

        {course.summary && (
          <p className="mt-1.5 line-clamp-3 text-body-md text-md-on-surface-variant">
            {course.summary}
          </p>
        )}

        <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-md-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Stages</dt>
            <LayersIcon className="h-4 w-4" />
            <dd>
              {course.stageCount} stage{course.stageCount === 1 ? "" : "s"}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Estimated length</dt>
            <ClockIcon className="h-4 w-4" />
            <dd>
              ~{weeks} week{weeks === 1 ? "" : "s"}
            </dd>
          </div>
          {course.practiceCount > 0 && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Practice problems</dt>
              <TargetIcon className="h-4 w-4" />
              <dd>{course.practiceCount} practice</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="relative z-10 mt-5 flex items-center gap-2">
        {course.saved ? (
          // Not a button: adding again does nothing, and a disabled control
          // here would read as "temporarily unavailable" rather than "done".
          <span className="inline-flex min-h-touch items-center gap-2 rounded-full bg-md-primary-container px-4 text-label-lg text-md-on-primary-container">
            <CheckIcon className="h-[1.125rem] w-[1.125rem]" />
            In your library
          </span>
        ) : (
          <MdButton
            variant="tonal"
            size="sm"
            icon={<PlusIcon />}
            disabled={adding}
            onClick={() => onAdd(course)}
          >
            {adding ? "Adding…" : signedIn ? "Add to library" : "Sign in to add"}
          </MdButton>
        )}

        {course.learners > 0 && (
          <span className="ml-auto truncate text-body-sm text-md-on-surface-variant">
            {course.learners} learner{course.learners === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </article>
  );
}
