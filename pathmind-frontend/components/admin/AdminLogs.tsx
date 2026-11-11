"use client";

import { useState } from "react";
import { useAdminActivity, useAdminAudit } from "@/hooks/useAdminQuery";
import { Pager, RecordListSkeleton, Section, TimeAgo } from "./AdminPrimitives";
import { Badge } from "@/components/ui/Badge";
import { StateView } from "@/components/ui/StateView";
import { clsx } from "@/lib/clsx";
import type { AuditEntry } from "@/types/catalog";

const ACTION_FILTERS = [
  { value: "", label: "All actions" },
  { value: "user.role_changed", label: "Role changed" },
  { value: "user.suspended", label: "Suspended" },
  { value: "user.unsuspended", label: "Restored" },
  { value: "user.deleted", label: "User deleted" },
  { value: "roadmap.published", label: "Course published" },
  { value: "roadmap.unpublished", label: "Course unpublished" },
  { value: "roadmap.deleted", label: "Course deleted" },
  { value: "roadmap.updated", label: "Course edited" },
];

/** Reads the audit action as a sentence, with the actor and target filled in. */
function describe(entry: AuditEntry): string {
  const target = entry.targetLabel;
  switch (entry.action) {
    case "user.role_changed": {
      const to = (entry.meta?.to as string) ?? "a new role";
      return to === "admin" ? `made ${target} an admin` : `removed admin access from ${target}`;
    }
    case "user.suspended":
      return `suspended ${target}`;
    case "user.unsuspended":
      return `restored ${target}`;
    case "user.deleted":
      return `permanently deleted ${target}`;
    case "roadmap.published":
      return `published "${target}"`;
    case "roadmap.unpublished":
      return `unpublished "${target}"`;
    case "roadmap.deleted":
      return `deleted "${target}"`;
    case "roadmap.updated":
      return `edited "${target}"`;
    default:
      return `${entry.action} on ${target}`;
  }
}

const DESTRUCTIVE = new Set([
  "user.deleted",
  "user.suspended",
  "roadmap.deleted",
  "roadmap.unpublished",
]);

/**
 * The audit trail and the platform activity feed.
 *
 * They are separate lists because they answer different questions and have
 * different weight. The **audit log** records what admins did — it is a
 * security control, append-only, and nothing in the product can delete an
 * entry. The **activity feed** is what learners did, and exists for a sense of
 * whether the platform is being used at all.
 *
 * Both are read-only, which is the point: a log an admin can edit is not a log.
 */
export function AdminLogs() {
  const [action, setAction] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  const audit = useAdminAudit({ action: action || undefined, page: auditPage });
  const activity = useAdminActivity({ page: activityPage });

  const auditItems = audit.data?.items ?? [];
  const activityItems = activity.data?.items ?? [];

  return (
    <div className="space-y-10">
      <Section
        title="Admin audit log"
        description="Every state-changing admin action, oldest entries kept forever. Nothing in the product can remove one."
        actions={
          <label className="flex min-w-0 flex-col gap-1">
            <span className="sr-only">Filter by action</span>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setAuditPage(1);
              }}
              className="min-h-touch min-w-0 rounded-sm border border-md-outline bg-md-surface-container px-3 text-body-md text-md-on-surface"
            >
              {ACTION_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        }
      >
        {audit.isLoading ? (
          <RecordListSkeleton count={4} />
        ) : audit.isError ? (
          <StateView
            tone="error"
            title="The audit log could not be loaded"
            description="The server did not answer. The log itself is unaffected — this screen only reads it."
            primary={{ label: "Try again", onClick: () => void audit.refetch() }}
          />
        ) : auditItems.length === 0 ? (
          <StateView
            title={action ? "No entries for that action" : "No admin actions yet"}
            description={
              action
                ? "Nothing of that kind has been recorded. Try a different action, or show them all."
                : "Nothing has been suspended, promoted or unpublished. Entries appear here the moment an admin changes something."
            }
            primary={
              action ? { label: "Show all actions", onClick: () => setAction("") } : undefined
            }
          />
        ) : (
          <ul className={clsx("space-y-2", audit.isFetching && "opacity-60 transition-opacity")}>
            {auditItems.map((entry) => (
              <li
                key={entry.id}
                className="flex min-w-0 flex-col gap-2 rounded-md border border-md-outline-variant bg-md-surface-container-low p-4 sm:flex-row sm:items-start sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words text-body-lg text-md-on-surface">
                    <span className="font-medium">{entry.actorEmail}</span> {describe(entry)}
                  </p>
                  {typeof entry.meta?.reason === "string" && (
                    <p className="mt-1 break-words text-body-sm text-md-on-surface-variant">
                      Reason: {entry.meta.reason}
                    </p>
                  )}
                  <p className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone={DESTRUCTIVE.has(entry.action) ? "warning" : "neutral"}>
                      {entry.action}
                    </Badge>
                  </p>
                </div>
                <p className="flex-none text-body-sm text-md-on-surface-variant">
                  <TimeAgo iso={entry.createdAt} />
                </p>
              </li>
            ))}
          </ul>
        )}

        {audit.data && (
          <Pager
            page={audit.data.page}
            pages={audit.data.pages}
            total={audit.data.total}
            onChange={setAuditPage}
          />
        )}
      </Section>

      <Section
        title="Platform activity"
        description="What learners have been doing, newest first."
      >
        {activity.isLoading ? (
          <RecordListSkeleton count={4} />
        ) : activity.isError ? (
          <StateView
            tone="error"
            title="The activity feed could not be loaded"
            description="The server did not answer. Try again in a moment."
            primary={{ label: "Try again", onClick: () => void activity.refetch() }}
          />
        ) : activityItems.length === 0 ? (
          <StateView
            title="No activity yet"
            description="Nobody has completed a stage or saved a course. Once they do, it shows up here."
          />
        ) : (
          <ul
            className={clsx("space-y-2", activity.isFetching && "opacity-60 transition-opacity")}
          >
            {activityItems.map((entry) => (
              <li
                key={entry.id}
                className="flex min-w-0 items-start gap-3 rounded-md bg-md-surface-container-low p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words text-body-md text-md-on-surface">
                    {entry.title ?? entry.type}
                    {entry.subtitle && (
                      <span className="text-md-on-surface-variant"> · {entry.subtitle}</span>
                    )}
                  </p>
                  <p className="mt-0.5 break-all text-body-sm text-md-on-surface-variant">
                    {entry.actorEmail}
                  </p>
                </div>
                <p className="flex-none text-body-sm text-md-on-surface-variant">
                  <TimeAgo iso={entry.createdAt} />
                </p>
              </li>
            ))}
          </ul>
        )}

        {activity.data && (
          <Pager
            page={activity.data.page}
            pages={activity.data.pages}
            total={activity.data.total}
            onChange={setActivityPage}
          />
        )}
      </Section>
    </div>
  );
}
