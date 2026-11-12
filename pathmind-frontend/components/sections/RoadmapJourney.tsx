"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { clsx } from "@/lib/clsx";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Illustration } from "@/components/ui/Illustration";
import { CertificatesPanel } from "@/components/roadmap/CertificatesPanel";
import { CertificateQuiz } from "@/components/roadmap/CertificateQuiz";
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

type Tab = "roadmap" | "resources" | "practice" | "certificates";

/** M3 common-button classes for the two header links — `<a>` elements, so
 *  they can't go through `ui/Button`, but they sit on the same shape, size
 *  and state-layer rules as every real button on the screen. */
const LINK_BUTTON =
  "state-layer press inline-flex min-h-touch items-center gap-2 rounded-full px-6 text-label-lg font-medium transition-colors duration-fast ease-standard";

/**
 * Section opener for a tab panel — eyebrow, headline, one supporting line.
 *
 * The Resources and Practice panels used to drop straight into a bare grid
 * with no heading at all, so switching tabs felt like switching to a different,
 * plainer app. This is the same opener every landing section uses.
 */
function TabIntro({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: ReactNode;
  copy: string;
}) {
  return (
    <div className="mt-8 max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-headline-sm leading-[1.2] text-md-on-surface sm:text-headline-md">
        {title}
      </h2>
      <p className="mt-3 text-body-md text-md-on-surface-variant sm:text-body-lg">{copy}</p>
    </div>
  );
}

/**
 * One external link in a tab panel: an accent icon tile, a kicker, the title,
 * its stage, and an arrow that slides on hover.
 *
 * The arrow only moves under `hover:` — it is a desktop affordance, and the
 * whole tile is the touch target either way.
 */
function LinkCard({
  icon,
  kicker,
  title,
  meta,
  href,
}: {
  icon: ReactNode;
  kicker: string;
  title: string;
  meta: string;
  href: string;
}) {
  return (
    <li className="group min-w-0">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="state-layer flex min-h-touch gap-4 rounded-lg border border-md-outline-variant/70 bg-md-surface-container-low/70 p-4 shadow-e1 backdrop-blur-sm transition-colors duration-fast ease-standard hover:border-md-primary/60"
      >
        <span className="mt-0.5 grid h-10 w-10 flex-none place-items-center rounded-md bg-md-primary-container text-md-on-primary-container">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-label-sm uppercase tracking-[0.2em] text-md-primary">
            {kicker}
          </span>
          <span className="mt-1.5 block break-words text-body-lg font-medium text-md-on-surface">
            {title}
          </span>
          <span className="mt-1 block truncate text-body-sm text-md-on-surface-variant">
            {meta}
          </span>
        </span>
        <span
          aria-hidden
          className="mt-0.5 flex-none self-start text-md-on-surface-variant transition-transform duration-fast ease-standard group-hover:translate-x-1 group-hover:text-md-primary"
        >
          <ArrowRightIcon className="h-5 w-5" />
        </span>
      </a>
    </li>
  );
}

/** The API returns difficulty lowercase ("easy"). The old practice markup
 *  leaned on a `capitalize` class; the shared card doesn't carry one, so the
 *  value is cased here instead. */
function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Empty state for a tab panel — brand art rather than a bordered sentence. */
function EmptyTab({
  art,
  title,
  copy,
}: {
  art: "resources" | "practice";
  title: string;
  copy: string;
}) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-xl border border-md-outline-variant/60 bg-md-surface-container-low/50 px-6 py-12 text-center backdrop-blur-sm">
      <Illustration name={art} glow alt="" className="h-32 w-32" />
      <p className="mt-6 text-title-md text-md-on-surface">{title}</p>
      <p className="mt-2 max-w-sm text-body-md text-md-on-surface-variant">{copy}</p>
    </div>
  );
}

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
  const [quizOpen, setQuizOpen] = useState(false);
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
  // Certifications are authored per course and attached to the final stage,
  // but a learner thinks about them per course, not per stage. De-duplicated
  // by URL because a seeded course and a generated one can cite the same
  // programme from different stages.
  const allCertifications = useMemo(() => {
    const seen = new Set<string>();
    return stages
      .flatMap((s) => s.certifications)
      .filter((c) => (seen.has(c.url) ? false : (seen.add(c.url), true)));
  }, [stages]);

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
              {
                key: "certificates",
                label: `Certificates (${allCertifications.length})`,
                icon: MedalIcon,
              },
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
          <div>
            <TabIntro
              eyebrow="Every resource"
              title={
                <>
                  Everything worth reading,{" "}
                  <span className="text-md-primary">in one list</span>
                </>
              }
              copy="Docs, articles and videos pulled from every stage of this roadmap. Each one opens in a new tab so you don't lose your place."
            />

            {allResources.length === 0 ? (
              <EmptyTab
                art="resources"
                title="No resources yet"
                copy="Nothing has been attached to the stages of this roadmap. Resources appear here as soon as a stage carries one."
              />
            ) : (
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {allResources.map((resource) => (
                  <LinkCard
                    key={`${resource.stageTitle}-${resource.url}`}
                    icon={<BookIcon className="h-5 w-5" />}
                    kicker={resource.type}
                    title={resource.title}
                    meta={resource.stageTitle}
                    href={resource.url}
                  />
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Practice ─────────────────────────────────────────────── */}
        {tab === "practice" && (
          <div>
            <TabIntro
              eyebrow="Practice arena"
              title={
                <>
                  Problems that make it <span className="text-md-primary">stick</span>
                </>
              }
              copy="Curated LeetCode, CodeChef and HackerRank problems resolved from a maintained seed map — never invented, always real."
            />

            {allPractice.length === 0 ? (
              <EmptyTab
                art="practice"
                title="No practice problems yet"
                copy="This roadmap's stages don't carry practice links. They show up here the moment a stage does."
              />
            ) : (
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {allPractice.map((problem) => (
                  <LinkCard
                    key={`${problem.stageTitle}-${problem.url}`}
                    icon={<TargetIcon className="h-5 w-5" />}
                    kicker={problem.platform}
                    title={problem.title}
                    meta={`${titleCase(problem.difficulty)} · ${problem.stageTitle}`}
                    href={problem.url}
                  />
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── External certificates ────────────────────────────────── */}
        {tab === "certificates" && <CertificatesPanel certifications={allCertifications} />}

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
                  {existingCertificate
                    ? "Earned — your certificate is on your profile."
                    : isFinished
                      ? "Every stage is done. Pass a 10-question quiz — 8 correct — to earn your certificate."
                      : `Finish all ${stages.length} stages, then pass a 10-question quiz, to earn a completion certificate (${completedCount} done).`}
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
                // Opens the quiz rather than issuing directly. The server
                // refuses to issue without a recorded pass, so a button that
                // called the issue endpoint straight off would simply error.
                onClick={() => setQuizOpen(true)}
                // Disabled rather than hidden so the reward is visible from the
                // start; the copy above says exactly what unlocks it.
                disabled={!isFinished}
                isLoading={issueCertificate.isPending}
                loadingLabel="Issuing…"
              >
                <MedalIcon className="h-5 w-5" />
                Take the quiz
              </Button>
            )}
          </div>
        </section>
      </div>

      {/* Passing is what the server checks before it will issue anything, so
          the certificate request is fired from the pass callback rather than
          from the button that opens the quiz. */}
      <CertificateQuiz
        roadmapId={roadmap.id}
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        onPassed={() => issueCertificate.mutate(roadmap.id)}
      />
    </div>
  );
}
