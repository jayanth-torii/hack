"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { clsx } from "@/lib/clsx";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StageTimeline, type StageState } from "@/components/sections/StageTimeline";
import { useToggleStageItem, useUpdateProgress } from "@/hooks/useRoadmapQuery";
import { useIssueCertificate, useCertificates } from "@/hooks/useProfileQuery";
import type { Roadmap, Stage } from "@/types/roadmap";
import type { UserProgress } from "@/types/progress";
import {
  ArrowRightIcon,
  BookIcon,
  CheckCircleIcon,
  ChartIcon,
  ClockIcon,
  DownloadIcon,
  LayersIcon,
  MedalIcon,
  TargetIcon,
  TrophyIcon,
} from "@/components/profile/ProfileIcons";

interface RoadmapJourneyProps {
  roadmap: Roadmap;
  progress?: UserProgress;
}

type Tab = "roadmap" | "resources" | "practice";

/** M3 common-button classes for the two header links — `<a>` elements, so
 *  they can't go through `ui/Button`, but they sit on the same shape, size
 *  and state-layer rules as every real button on the screen. */
const LINK_BUTTON =
  "state-layer press inline-flex min-h-touch items-center gap-2 rounded-full px-6 text-label-lg font-medium transition-colors duration-fast ease-standard";

/**
 * The learning journey.
 *
 * Stage state is read from the server's `unlockedStageIds` / `completedStageIds`
 * — the locked styling here is a reflection of that, never the gate itself.
 * Marking a stage complete goes through `useUpdateProgress`, which the backend
 * validates before advancing anything.
 *
 * Only the tabs with real data exist. There is no Notes, Projects or Discussion
 * tab because nothing in the data model backs them. The tabs are filter chips
 * on an inline rail, not a popup — switching one never leaves the screen.
 */
export function RoadmapJourney({ roadmap, progress }: RoadmapJourneyProps) {
  const [tab, setTab] = useState<Tab>("roadmap");
  const updateProgress = useUpdateProgress();
  const toggleItem = useToggleStageItem();
  const issueCertificate = useIssueCertificate();
  const certificates = useCertificates();

  const stages = useMemo(
    () => [...roadmap.stages].sort((a, b) => a.order - b.order),
    [roadmap.stages]
  );

  const completedSet = useMemo(
    () => new Set(progress?.completedStageIds ?? []),
    [progress?.completedStageIds]
  );
  const unlockedSet = useMemo(() => {
    const set = new Set(progress?.unlockedStageIds ?? []);
    // Before progress lands, only the first stage can be open — matching the
    // server's own rule rather than optimistically unlocking everything.
    if (!progress && stages[0]) set.add(stages[0].id);
    return set;
  }, [progress, stages]);

  const stateOf = (stage: Stage): StageState => {
    if (completedSet.has(stage.id)) return "completed";
    if (unlockedSet.has(stage.id)) return "active";
    return "locked";
  };

  const completedCount = stages.filter((s) => completedSet.has(s.id)).length;
  const percent = stages.length === 0 ? 0 : Math.round((completedCount / stages.length) * 100);
  const isFinished = stages.length > 0 && completedCount === stages.length;
  const totalDays = stages.reduce((sum, s) => sum + (s.estimatedDays ?? 0), 0);

  // The dominant difficulty across stages is a fair summary for the header.
  const headlineDifficulty = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of stages) counts.set(s.difficulty, (counts.get(s.difficulty) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "beginner";
  }, [stages]);

  const existingCertificate = (certificates.data ?? []).find(
    (c) => c.roadmapId === roadmap.id
  );

  const nextStage = stages.find((s) => unlockedSet.has(s.id) && !completedSet.has(s.id));

  const allResources = useMemo(
    () => stages.flatMap((s) => s.resources.map((r) => ({ ...r, stageTitle: s.title }))),
    [stages]
  );
  const allPractice = useMemo(
    () => stages.flatMap((s) => s.practiceLinks.map((p) => ({ ...p, stageTitle: s.title }))),
    [stages]
  );

  return (
    <div className="pt-app-bar pb-nav">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <nav aria-label="Breadcrumb" className="text-body-sm text-md-on-surface-variant">
          <ol className="flex items-center gap-2">
            <li>
              {/* -my-3/py-3 grows the tap target to the 44px floor without
                  changing the crumb row's visual height. */}
              <Link
                href="/saved"
                className="-my-3 inline-flex min-h-touch-min items-center rounded-xs py-3 transition-colors duration-fast ease-standard hover:text-md-primary"
              >
                Roadmaps
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="truncate text-md-on-surface">
              {roadmap.topic}
            </li>
          </ol>
        </nav>

        {/* ── Header — an M3 filled card ───────────────────────────── */}
        <header className="relative mt-4 overflow-hidden rounded-xl border border-md-outline-variant bg-md-surface-container-low p-5 sm:p-7">
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <Eyebrow>Your learning path</Eyebrow>
              <h1 className="mt-2 break-words text-headline-md text-md-on-surface sm:text-display-sm">
                {roadmap.topic}
              </h1>
              <p className="mt-2.5 max-w-xl text-body-md text-md-on-surface-variant">
                A structured path of {stages.length}{" "}
                {stages.length === 1 ? "stage" : "stages"}, sequenced by difficulty and unlocked
                one at a time as you finish the one before it.
              </p>

              {/* Assist chips — 8dp corners, outlined, label + icon. */}
              <ul className="mt-4 flex flex-wrap gap-2">
                <li className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-md-outline-variant px-3 text-label-lg text-md-on-surface-variant">
                  <LayersIcon className="h-[1.125rem] w-[1.125rem] text-md-primary" />
                  {stages.length} stages
                </li>
                {totalDays > 0 && (
                  <li className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-md-outline-variant px-3 text-label-lg text-md-on-surface-variant">
                    <ClockIcon className="h-[1.125rem] w-[1.125rem] text-md-primary" />~{totalDays}{" "}
                    days
                  </li>
                )}
                <li className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-md-outline-variant px-3 text-label-lg capitalize text-md-on-surface-variant">
                  <ChartIcon className="h-[1.125rem] w-[1.125rem] text-md-primary" />
                  {headlineDifficulty}
                </li>
              </ul>

              <div className="mt-5 flex flex-wrap gap-3">
                {nextStage ? (
                  // The one filled button in this card.
                  <a
                    href={`#stage-${nextStage.id}`}
                    className={clsx(LINK_BUTTON, "bg-md-primary text-md-on-primary")}
                  >
                    Continue learning
                    <ArrowRightIcon className="h-5 w-5" />
                  </a>
                ) : (
                  <span className="inline-flex min-h-touch items-center gap-2 rounded-full bg-md-success-container px-5 text-label-lg font-medium text-md-on-success-container">
                    <CheckCircleIcon className="h-5 w-5" />
                    All stages complete
                  </span>
                )}
                <Link
                  href={`/roadmap/${roadmap.id}/dashboard`}
                  className={clsx(LINK_BUTTON, "border border-md-outline text-md-on-surface")}
                >
                  <ChartIcon className="h-5 w-5" />
                  Dashboard
                </Link>
                <Link
                  href={`/roadmap/${roadmap.id}/calendar`}
                  className={clsx(LINK_BUTTON, "border border-md-outline text-md-on-surface")}
                >
                  <ClockIcon className="h-5 w-5" />
                  Calendar
                </Link>
              </div>
            </div>

            {/* Ring, then the scene — both in flow, so neither can land on top
                of the other the way an absolutely-positioned backdrop did. */}
            <div className="flex items-center gap-6 lg:justify-end">
              <ProgressRing percent={percent} size={118} sublabel="progress" />
              <div aria-hidden data-scene-stage className="hidden shrink-0 xl:block">
                <Image
                  src="/3d/how-header.png"
                  alt=""
                  width={846}
                  height={356}
                  sizes="22vw"
                  className="h-auto w-64 select-none opacity-85"
                />
              </div>
            </div>
          </div>
        </header>

        {/* ── Tabs — M3 filter chips on a scrolling rail ───────────── */}
        <div role="tablist" aria-label="Roadmap views" className="rail mt-5 py-1">
          {(
            [
              { key: "roadmap", label: "Roadmap", icon: LayersIcon },
              { key: "resources", label: `Resources (${allResources.length})`, icon: BookIcon },
              { key: "practice", label: `Practice (${allPractice.length})`, icon: TargetIcon },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={clsx(
                "state-layer press inline-flex min-h-touch items-center gap-2 rounded-sm border px-4 text-label-lg font-medium transition-colors duration-fast ease-standard",
                tab === key
                  ? "border-transparent bg-md-secondary-container text-md-on-secondary-container"
                  : "border-md-outline text-md-on-surface-variant"
              )}
            >
              <Icon className="h-[1.125rem] w-[1.125rem]" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Roadmap timeline ─────────────────────── */}
        {tab === "roadmap" && (
          <StageTimeline
            stages={stages}
            stateOf={stateOf}
            completedItems={progress?.completedItems ?? {}}
            isSaving={toggleItem.isPending || updateProgress.isPending}
            onToggleItem={(stage, index, done) =>
              toggleItem.mutate({ roadmapId: roadmap.id, stageId: stage.id, index, done })
            }
            onMarkComplete={(stage) =>
              updateProgress.mutate({ roadmapId: roadmap.id, stageId: stage.id })
            }
            onShowResources={() => setTab("resources")}
          />
        )}

        {/* ── Resources ────────────────────────────────────────────── */}
        {tab === "resources" && (
          <div className="mt-6">
            {allResources.length === 0 ? (
              <p className="rounded-lg border border-md-outline-variant px-6 py-12 text-center text-body-md text-md-on-surface-variant">
                No resources attached to this roadmap yet.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {allResources.map((resource) => (
                  <li
                    key={`${resource.stageTitle}-${resource.url}`}
                    className="min-w-0 rounded-md border border-md-outline-variant bg-md-surface-container-low transition-colors duration-fast ease-standard hover:border-md-primary"
                  >
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="state-layer block min-h-touch-min rounded-md p-4"
                    >
                      <p className="text-label-sm uppercase tracking-[0.2em] text-md-primary">
                        {resource.type}
                      </p>
                      <p className="mt-1.5 break-words text-body-lg font-medium text-md-on-surface">
                        {resource.title}
                      </p>
                      <p className="mt-1 truncate text-body-sm text-md-on-surface-variant">
                        {resource.stageTitle}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Practice ─────────────────────────────────────────────── */}
        {tab === "practice" && (
          <div className="mt-6">
            {allPractice.length === 0 ? (
              <p className="rounded-lg border border-md-outline-variant px-6 py-12 text-center text-body-md text-md-on-surface-variant">
                No practice problems attached to this roadmap yet.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {allPractice.map((problem) => (
                  <li
                    key={`${problem.stageTitle}-${problem.url}`}
                    className="min-w-0 rounded-md border border-md-outline-variant bg-md-surface-container-low transition-colors duration-fast ease-standard hover:border-md-primary"
                  >
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="state-layer block min-h-touch-min rounded-md p-4"
                    >
                      <p className="text-label-sm uppercase tracking-[0.2em] text-md-primary">
                        {problem.platform}
                      </p>
                      <p className="mt-1.5 break-words text-body-lg font-medium text-md-on-surface">
                        {problem.title}
                      </p>
                      <p className="mt-1 truncate text-body-sm capitalize text-md-on-surface-variant">
                        {problem.difficulty} · {problem.stageTitle}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Completion / certificate ─────────────────────────────── */}
        <section className="mt-6 overflow-hidden rounded-xl border border-md-outline-variant bg-md-surface-container-low p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-md-primary-container text-md-on-primary-container">
                <TrophyIcon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="text-title-lg font-medium text-md-on-surface">
                  Complete the roadmap
                </h2>
                <p className="mt-0.5 text-body-md text-md-on-surface-variant">
                  {isFinished
                    ? "Every stage is done — claim your certificate."
                    : `Finish all ${stages.length} stages to earn a completion certificate (${completedCount} done).`}
                </p>
              </div>
            </div>

            {existingCertificate ? (
              <Link
                href="/profile"
                className={clsx(LINK_BUTTON, "shrink-0 bg-md-primary text-md-on-primary")}
              >
                <DownloadIcon className="h-5 w-5" />
                Download certificate
              </Link>
            ) : (
              <Button
                variant="accent"
                className="shrink-0"
                onClick={() => issueCertificate.mutate(roadmap.id)}
                // Disabled rather than hidden so the reward is visible from the
                // start; the copy above says exactly what unlocks it.
                disabled={!isFinished}
                isLoading={issueCertificate.isPending}
                loadingLabel="Issuing…"
              >
                <MedalIcon className="h-5 w-5" />
                Earn certificate
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
