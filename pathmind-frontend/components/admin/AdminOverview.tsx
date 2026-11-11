"use client";

import Link from "next/link";
import { useAdminStats } from "@/hooks/useAdminQuery";
import { Metric, RecordListSkeleton, Section, Sparkline } from "./AdminPrimitives";
import { StateView } from "@/components/ui/StateView";

/**
 * The platform at a glance.
 *
 * Every number here is **derived** from the collections on read — none of it
 * is a counter the app increments. That means the dashboard cannot drift out
 * of step with reality the way a denormalised stats document eventually does,
 * at the cost of a handful of aggregations per load. For a dashboard one
 * person opens a few times a day, that is the right side of the trade.
 */
export function AdminOverview() {
  const stats = useAdminStats();

  if (stats.isLoading) {
    return <RecordListSkeleton count={3} />;
  }

  if (stats.isError || !stats.data) {
    return (
      <StateView
        tone="error"
        title="The overview could not be loaded"
        description="The server did not return the platform statistics. Nothing has changed — this screen only reads."
        primary={{ label: "Try again", onClick: () => void stats.refetch() }}
      />
    );
  }

  const s = stats.data;
  const unverifiedShare =
    s.resources.total === 0 ? 0 : Math.round((s.resources.unverified / s.resources.total) * 100);

  return (
    <div className="space-y-10">
      <Section title="People" description="Accounts, growth and who is actually studying.">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Registered users" value={s.users.total} />
          <Metric
            label="Active (30 days)"
            value={s.users.activeLast30Days}
            hint={
              s.users.total > 0
                ? `${Math.round((s.users.activeLast30Days / s.users.total) * 100)}% of accounts`
                : undefined
            }
          />
          <Metric label="New this week" value={s.users.newLast7Days} hint={`${s.users.newLast30Days} in 30 days`} />
          <Metric
            label="Suspended"
            value={s.users.suspended}
            tone={s.users.suspended > 0 ? "warning" : "neutral"}
            hint={`${s.users.admins} admin${s.users.admins === 1 ? "" : "s"}`}
          />
        </dl>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Sparkline data={s.signups} label="New sign-ups per day" />
          <Sparkline data={s.activity} label="Stages completed per day" />
        </div>
      </Section>

      <Section title="Catalog" description="What the platform teaches, and how much of it is live.">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Courses total" value={s.roadmaps.total} />
          <Metric label="Curated" value={s.roadmaps.curated} hint={`${s.roadmaps.generated} generated or built`} />
          <Metric label="Published" value={s.roadmaps.published} />
          <Metric label="In someone's library" value={s.roadmaps.inUse} />
        </dl>

        {s.categories.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {s.categories.map((c) => (
              <li
                key={c.category}
                className="inline-flex h-8 items-center gap-2 rounded-sm border border-md-outline-variant px-3 text-label-lg text-md-on-surface-variant"
              >
                {c.category}
                <span className="tabular-nums text-md-on-surface">{c.count}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Learning" description="What learners have finished, not just started.">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Stages completed" value={s.learning.stagesCompleted} />
          <Metric label="Courses completed" value={s.learning.roadmapsCompleted} />
          <Metric label="Certificates issued" value={s.learning.certificatesIssued} />
          <Metric
            label="Failing links"
            value={s.resources.unverified}
            tone={s.resources.unverified > 0 ? "warning" : "success"}
            hint={`${unverifiedShare}% of ${s.resources.total} resources`}
          />
        </dl>
      </Section>

      <Section
        title="Most-saved courses"
        description="Counted from learners' libraries, so this is demand, not catalog size."
      >
        {s.popularTopics.length === 0 ? (
          <p className="rounded-md border border-dashed border-md-outline-variant p-5 text-body-md text-md-on-surface-variant">
            No course is in anyone&rsquo;s library yet. Once learners start adding courses, the
            most popular ones appear here.
          </p>
        ) : (
          <ol className="space-y-2">
            {s.popularTopics.map((t, i) => (
              <li
                key={t.slug}
                className="flex min-w-0 items-center gap-3 rounded-md bg-md-surface-container-low p-3"
              >
                <span
                  aria-hidden
                  className="grid h-8 w-8 flex-none place-items-center rounded-full bg-md-secondary-container text-label-md text-md-on-secondary-container"
                >
                  {i + 1}
                </span>
                <Link
                  href={`/roadmap/${t.slug}`}
                  className="-my-3 min-w-0 flex-1 truncate py-3 text-body-lg text-md-on-surface transition-colors duration-fast hover:text-md-primary"
                >
                  {t.topic}
                </Link>
                <span className="flex-none tabular-nums text-body-sm text-md-on-surface-variant">
                  {t.learners} learner{t.learners === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}
