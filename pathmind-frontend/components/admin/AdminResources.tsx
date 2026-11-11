"use client";

import { useEffect, useState } from "react";
import { useAdminResources } from "@/hooks/useAdminQuery";
import { Field, Pager, RecordCard, RecordListSkeleton, Section, TimeAgo } from "./AdminPrimitives";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { StateView } from "@/components/ui/StateView";
import { clsx } from "@/lib/clsx";

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * The broken-link queue.
 *
 * `verified: false` is what the freshness worker writes when a resource stops
 * resolving to live content, so this list is the worker's output rather than a
 * separate reporting system.
 *
 * It is deliberately **read-only**. The fix for a dead link is an edit to the
 * course catalog in `src/data/courses/*.json` followed by a re-seed, which is
 * reviewable and reproducible; a field an admin edits in production would
 * silently diverge from the catalog and be overwritten by the next seed.
 */
export function AdminResources() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"unverified" | "all">("unverified");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounced(search);
  const resources = useAdminResources({
    status,
    q: debouncedSearch.trim() || undefined,
    page,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const items = resources.data?.items ?? [];

  return (
    <Section
      title="Resources"
      description="Every free resource linked from a course stage, with the ones that stopped resolving first."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Input
            label="Search by link, title or course"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            autoComplete="off"
          />
        </div>
        <label className="flex min-w-0 flex-none flex-col gap-1">
          <span className="text-body-sm text-md-on-surface-variant">Show</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "unverified" | "all")}
            className="min-h-touch min-w-0 rounded-sm border border-md-outline bg-md-surface-container px-3 text-body-md text-md-on-surface"
          >
            <option value="unverified">Failing links only</option>
            <option value="all">All resources</option>
          </select>
        </label>
      </div>

      <p className="mt-4 rounded-md border border-md-outline-variant p-3 text-body-sm text-md-on-surface-variant">
        This list is read-only. A dead link is fixed in the course catalog
        (<code className="text-md-on-surface">src/data/courses/*.json</code>) and re-seeded, so the
        change is reviewable and survives the next seed.
      </p>

      <div className="mt-5">
        {resources.isLoading ? (
          <RecordListSkeleton />
        ) : resources.isError ? (
          <StateView
            tone="error"
            title="Resources could not be loaded"
            description="The server did not answer. Try again in a moment."
            primary={{ label: "Try again", onClick: () => void resources.refetch() }}
          />
        ) : items.length === 0 ? (
          <StateView
            title={status === "unverified" ? "No failing links" : "No resources match"}
            description={
              status === "unverified"
                ? "Every linked resource resolved the last time the freshness worker checked. Nothing needs attention."
                : "Try a different search term, or switch back to failing links only."
            }
            primary={
              status === "unverified"
                ? { label: "Show all resources", onClick: () => setStatus("all") }
                : { label: "Clear search", onClick: () => setSearch("") }
            }
          />
        ) : (
          <ul
            className={clsx("space-y-3", resources.isFetching && "opacity-60 transition-opacity")}
          >
            {items.map((resource, index) => (
              <RecordCard
                key={`${resource.roadmapId}-${resource.url}-${index}`}
                title={resource.title}
                subtitle={
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-my-2 inline-block break-all py-2 transition-colors duration-fast hover:text-md-primary"
                  >
                    {resource.url}
                  </a>
                }
                // The word carries the status; the tone only reinforces it.
                badges={
                  <>
                    <Badge tone={resource.verified ? "success" : "warning"}>
                      {resource.verified ? "Resolving" : "Not resolving"}
                    </Badge>
                    <Badge>{resource.type}</Badge>
                    {!resource.published && <Badge tone="neutral">Course hidden</Badge>}
                  </>
                }
                fields={
                  <>
                    <Field label="Course" className="col-span-2">
                      {resource.topic}
                    </Field>
                    <Field label="Stage" className="col-span-2">
                      {resource.stageTitle}
                    </Field>
                    <Field label="Last checked">
                      <TimeAgo iso={resource.lastVerifiedAt} />
                    </Field>
                  </>
                }
              />
            ))}
          </ul>
        )}

        {resources.data && (
          <Pager
            page={resources.data.page}
            pages={resources.data.pages}
            total={resources.data.total}
            onChange={setPage}
          />
        )}
      </div>
    </Section>
  );
}
