"use client";

import { Dialog } from "@/components/md/Dialog";
import { MdButton } from "@/components/md/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCourseDetail } from "@/hooks/useCatalogQuery";
import { clsx } from "@/lib/clsx";
import type { CatalogCourse, CourseLevel } from "@/types/catalog";
import { CheckIcon, ClockIcon, LayersIcon, PlusIcon } from "@/components/profile/ProfileIcons";

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
 * The course's difficulty **span**. The per-stage badges below are a single
 * level each — those are exact. The header chip is a range, because every
 * course here climbs, and naming only the ceiling would put "Advanced" on a
 * course that opens with two beginner stages.
 */
function levelSpan(difficulties: CourseLevel[]): { label: string; tone: "success" | "brand" | "warning" } {
  const first = difficulties[0] ?? "beginner";
  const last = difficulties[difficulties.length - 1] ?? first;
  return {
    label: first === last ? LEVEL_LABEL[first] : `${LEVEL_LABEL[first]} → ${LEVEL_LABEL[last]}`,
    tone: LEVEL_TONE[first],
  };
}

interface CoursePreviewProps {
  /** The card that was tapped — used for the header before detail arrives. */
  course: CatalogCourse | null;
  onClose: () => void;
  onAdd: (course: CatalogCourse) => void;
  adding?: boolean;
  signedIn: boolean;
}

/**
 * The course's full syllabus, before committing to it.
 *
 * Deliberately a `md/Dialog` rather than a route: the learner is mid-browse,
 * and sending them to a page means a back navigation and a re-fetch of the
 * grid to return to exactly where they were. On a phone the dialog *is* a
 * full-screen page with a back arrow and hardware-Back wiring, so it reads as
 * a navigation anyway — which is the whole point of the pattern (CLAUDE.md §5,
 * "no popups on phones").
 *
 * The card only carries counts, so the stage list is fetched here, on open —
 * `useCourseDetail` is disabled until a course is selected, so browsing the
 * grid costs nothing.
 */
export function CoursePreview({ course, onClose, onAdd, adding, signedIn }: CoursePreviewProps) {
  const detail = useCourseDetail(course?.id ?? null);
  const stages = detail.data?.course.stages ?? [];
  const saved = detail.data?.meta.saved ?? course?.saved ?? false;

  return (
    <Dialog
      open={Boolean(course)}
      onClose={onClose}
      title={course?.topic ?? "Course"}
      size="lg"
      headline={false}
      dismissible
      actions={
        course ? (
          saved ? (
            <MdButton variant="tonal" icon={<CheckIcon />} onClick={onClose}>
              In your library
            </MdButton>
          ) : (
            <>
              <MdButton variant="text" onClick={onClose}>
                Close
              </MdButton>
              <MdButton
                variant="filled"
                icon={<PlusIcon />}
                disabled={adding}
                onClick={() => onAdd(course)}
              >
                {adding ? "Adding…" : signedIn ? "Add to library" : "Sign in to add"}
              </MdButton>
            </>
          )
        ) : null
      }
    >
      {course && (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={levelSpan(course.difficulties).tone}>
              {levelSpan(course.difficulties).label}
            </Badge>
            {course.category && <Badge>{course.category}</Badge>}
          </div>

          <h2 className="mt-4 text-headline-sm text-md-on-surface">{course.topic}</h2>
          {course.summary && (
            <p className="mt-2 text-body-md text-md-on-surface-variant">{course.summary}</p>
          )}

          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-md-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Stages</dt>
              <LayersIcon className="h-4 w-4" />
              <dd>{course.stageCount} stages</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Estimated length</dt>
              <ClockIcon className="h-4 w-4" />
              <dd>{course.totalDays} days of study</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Free resources</dt>
              <dd>{course.resourceCount} free resources</dd>
            </div>
          </dl>

          <h3 className="mt-7 text-title-sm uppercase tracking-wider text-md-on-surface-variant">
            What you will cover
          </h3>

          {detail.isLoading && (
            <div role="status" aria-live="polite" aria-busy="true" className="mt-3 space-y-3">
              <span className="sr-only">Loading the syllabus</span>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="rounded-md border border-md-outline-variant p-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-3 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-4/5" />
                </div>
              ))}
            </div>
          )}

          {detail.isError && (
            <p
              role="alert"
              className="mt-3 rounded-md bg-md-error-container p-4 text-body-md text-md-on-error-container"
            >
              The syllabus could not be loaded. You can still add the course — the stages will be
              there when you open it.
            </p>
          )}

          {!detail.isLoading && !detail.isError && (
            <ol className="mt-3 space-y-3">
              {stages.map((stage, index) => (
                <li
                  key={stage._id}
                  className="min-w-0 rounded-md border border-md-outline-variant bg-md-surface-container p-4"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span
                      aria-hidden
                      className={clsx(
                        "grid h-7 w-7 flex-none place-items-center rounded-full text-label-md",
                        "bg-md-secondary-container text-md-on-secondary-container"
                      )}
                    >
                      {index + 1}
                    </span>
                    <h4 className="min-w-0 flex-1 text-title-sm text-md-on-surface">
                      {stage.title}
                    </h4>
                    <Badge tone={LEVEL_TONE[stage.difficulty]}>
                      {LEVEL_LABEL[stage.difficulty]}
                    </Badge>
                  </div>

                  <p className="mt-2 text-body-sm text-md-on-surface-variant">
                    {stage.estimatedDays} day{stage.estimatedDays === 1 ? "" : "s"} ·{" "}
                    {stage.freeResources.length} resource
                    {stage.freeResources.length === 1 ? "" : "s"}
                    {stage.type === "practice" ? " · practice stage" : ""}
                  </p>

                  {stage.syllabus.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {stage.syllabus.map((item, i) => (
                        <li
                          key={`${stage._id}-${i}`}
                          className="flex gap-2 text-body-sm text-md-on-surface-variant"
                        >
                          <span aria-hidden className="mt-[0.45rem] h-1 w-1 flex-none rounded-full bg-md-outline" />
                          <span className="min-w-0">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </Dialog>
  );
}
