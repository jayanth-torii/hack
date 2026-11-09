"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { clsx } from "@/lib/clsx";
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

/**
 * The learning journey.
 *
 * Stage state is read from the server's `unlockedStageIds` / `completedStageIds`
 * — the locked styling here is a reflection of that, never the gate itself.
 * Marking a stage complete goes through `useUpdateProgress`, which the backend
 * validates before advancing anything.
 *
 * Only the tabs with real data exist. There is no Notes, Projects or Discussion
 * tab because nothing in the data model backs them.
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
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/saved" className="transition-colors hover:text-accent-text">
                Roadmaps
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="truncate text-subtle">
              {roadmap.topic}
            </li>
          </ol>
        </nav>

        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="relative mt-4 overflow-hidden rounded-xl border border-accent/25 bg-card/40 p-5 shadow-[0_0_60px_-26px_rgb(var(--color-accent)/0.65)] backdrop-blur-sm sm:p-7">
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <Eyebrow>Your learning path</Eyebrow>
              <h1 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-paper sm:text-4xl">
                {roadmap.topic}
              </h1>
              <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted">
                A structured path of {stages.length}{" "}
                {stages.length === 1 ? "stage" : "stages"}, sequenced by difficulty and unlocked
                one at a time as you finish the one before it.
              </p>

              <ul className="mt-4 flex flex-wrap gap-2">
                <li className="inline-flex items-center gap-1.5 rounded-full border border-line/15 bg-ink/40 px-3 py-1.5 text-xs text-subtle">
                  <LayersIcon className="h-3.5 w-3.5 text-accent-text" />
                  {stages.length} stages
                </li>
                {totalDays > 0 && (
                  <li className="inline-flex items-center gap-1.5 rounded-full border border-line/15 bg-ink/40 px-3 py-1.5 text-xs text-subtle">
                    <ClockIcon className="h-3.5 w-3.5 text-accent-text" />~{totalDays} days
                  </li>
                )}
                <li className="inline-flex items-center gap-1.5 rounded-full border border-line/15 bg-ink/40 px-3 py-1.5 text-xs capitalize text-subtle">
                  <ChartIcon className="h-3.5 w-3.5 text-accent-text" />
                  {headlineDifficulty}
                </li>
              </ul>

              <div className="mt-5 flex flex-wrap gap-3">
                {nextStage ? (
                  <a
                    href={`#stage-${nextStage.id}`}
                    className="press inline-flex min-h-touch items-center gap-2 rounded-full bg-accent px-6 text-sm font-bold text-on-accent transition-colors duration-fast hover:bg-accent-hover"
                  >
                    Continue learning
                    <ArrowRightIcon className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="inline-flex min-h-touch items-center gap-2 rounded-full border border-success/40 bg-success/10 px-5 text-sm font-bold text-success">
                    <CheckCircleIcon className="h-4 w-4" />
                    All stages complete
                  </span>
                )}
                <Link
                  href={`/roadmap/${roadmap.id}/dashboard`}
                  className="press inline-flex min-h-touch items-center gap-2 rounded-full border border-line/20 px-5 text-sm font-semibold text-subtle transition-colors duration-fast hover:border-accent/50 hover:text-accent-text"
                >
                  <ChartIcon className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href={`/roadmap/${roadmap.id}/calendar`}
                  className="press inline-flex min-h-touch items-center gap-2 rounded-full border border-line/20 px-5 text-sm font-semibold text-subtle transition-colors duration-fast hover:border-accent/50 hover:text-accent-text"
                >
                  <ClockIcon className="h-4 w-4" />
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

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Roadmap views"
          className="rail mt-5 rounded-xl border border-line/12 bg-card/30 p-1.5 backdrop-blur-sm"
        >
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
                "press inline-flex min-h-touch items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-fast",
                tab === key ? "bg-accent text-on-accent" : "text-muted hover:text-paper"
              )}
            >
              <Icon className="h-4 w-4" />
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
              <p className="rounded-xl border border-line/12 bg-card/30 px-6 py-12 text-center text-sm text-muted">
                No resources attached to this roadmap yet.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {allResources.map((resource) => (
                  <li
                    key={`${resource.stageTitle}-${resource.url}`}
                    className="rounded-md border border-line/12 bg-card/40 p-4 transition-colors duration-fast hover:border-accent/40"
                  >
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block min-h-touch-min"
                    >
                      <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-accent-text">
                        {resource.type}
                      </p>
                      <p className="mt-1.5 font-semibold leading-snug text-paper">
                        {resource.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted">{resource.stageTitle}</p>
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
              <p className="rounded-xl border border-line/12 bg-card/30 px-6 py-12 text-center text-sm text-muted">
                No practice problems attached to this roadmap yet.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {allPractice.map((problem) => (
                  <li
                    key={`${problem.stageTitle}-${problem.url}`}
                    className="rounded-md border border-line/12 bg-card/40 p-4 transition-colors duration-fast hover:border-accent/40"
                  >
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block min-h-touch-min"
                    >
                      <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-accent-text">
                        {problem.platform}
                      </p>
                      <p className="mt-1.5 font-semibold leading-snug text-paper">
                        {problem.title}
                      </p>
                      <p className="mt-1 truncate text-xs capitalize text-muted">
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
        <section className="mt-6 overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-r from-accent/[0.12] to-transparent p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-accent/40 bg-accent/[0.12] text-accent-text">
                <TrophyIcon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold tracking-tight text-paper">
                  Complete the roadmap
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {isFinished
                    ? "Every stage is done — claim your certificate."
                    : `Finish all ${stages.length} stages to earn a completion certificate (${completedCount} done).`}
                </p>
              </div>
            </div>

            {existingCertificate ? (
              <Link
                href="/profile"
                className="press inline-flex min-h-touch shrink-0 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-on-accent transition-colors duration-fast hover:bg-accent-hover"
              >
                <DownloadIcon className="h-4 w-4" />
                Download certificate
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => issueCertificate.mutate(roadmap.id)}
                disabled={!isFinished || issueCertificate.isPending}
                aria-busy={issueCertificate.isPending}
                // Disabled rather than hidden so the reward is visible from the
                // start; the copy above says exactly what unlocks it.
                className="press inline-flex min-h-touch shrink-0 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-on-accent transition-colors duration-fast hover:bg-accent-hover disabled:bg-line/15 disabled:text-muted"
              >
                <MedalIcon className="h-4 w-4" />
                {issueCertificate.isPending ? "Issuing…" : "Earn certificate"}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
