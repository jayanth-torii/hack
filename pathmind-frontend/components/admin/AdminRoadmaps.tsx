"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useAdminRoadmaps,
  useDeleteAdminRoadmap,
  useUpdateAdminRoadmap,
} from "@/hooks/useAdminQuery";
import { useCatalogCategories } from "@/hooks/useCatalogQuery";
import { Field, Pager, RecordCard, RecordListSkeleton, Section, TimeAgo } from "./AdminPrimitives";
import { MdButton } from "@/components/md/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { StateView } from "@/components/ui/StateView";
import { confirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api-client";
import { clsx } from "@/lib/clsx";
import type { AdminRoadmap } from "@/types/catalog";

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const SOURCES = [
  { value: "", label: "All sources" },
  { value: "curated", label: "Curated" },
  { value: "generated", label: "AI-generated" },
  { value: "custom", label: "Learner-built" },
];

const VISIBILITY = [
  { value: "", label: "Any visibility" },
  { value: "published", label: "Published" },
  { value: "hidden", label: "Hidden" },
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "topic", label: "A–Z" },
  { value: "learners", label: "Most learners" },
];

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-none">
      <span className="text-body-sm text-md-on-surface-variant">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-touch min-w-0 rounded-sm border border-md-outline bg-md-surface-container px-3 text-body-md text-md-on-surface"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  curated: "Curated",
  custom: "Learner-built",
};

/**
 * Course management.
 *
 * The two actions are deliberately unequal. **Unpublish** is the everyday tool
 * — reversible, keeps every learner's progress, just takes the course out of
 * the catalog. **Delete** is refused by the server while anyone has the course
 * saved, so the destructive path simply isn't reachable for a course in use,
 * and the refusal explains why rather than offering a force flag.
 */
export function AdminRoadmaps() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [visibility, setVisibility] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const debouncedSearch = useDebounced(search);
  const categories = useCatalogCategories();
  const roadmaps = useAdminRoadmaps({
    q: debouncedSearch.trim() || undefined,
    category: category || undefined,
    source: source || undefined,
    visibility: visibility || undefined,
    sort,
    page,
    limit: 20,
  });
  const update = useUpdateAdminRoadmap();
  const remove = useDeleteAdminRoadmap();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, source, visibility, sort]);

  function reportFailure(err: unknown, fallback: string) {
    if (err instanceof ApiClientError && err.status >= 400 && err.status < 500) {
      toast.error(err.message);
      return;
    }
    toast.error(fallback);
  }

  async function togglePublished(roadmap: AdminRoadmap) {
    const publishing = !roadmap.published;
    if (!publishing) {
      const ok = await confirm({
        title: "Hide this course from the catalog?",
        message:
          roadmap.learners > 0
            ? `${roadmap.learners} learner${roadmap.learners === 1 ? "" : "s"} already have "${roadmap.topic}" and keep it — it just stops appearing for everyone else.`
            : `"${roadmap.topic}" will no longer appear in the catalog. Publishing it again restores it unchanged.`,
        confirmLabel: "Unpublish",
        tone: "danger",
      });
      if (!ok) return;
    }

    setBusyId(roadmap.id);
    try {
      await update.mutateAsync({ id: roadmap.id, isPublicTemplate: publishing });
      toast.success(publishing ? `"${roadmap.topic}" published` : `"${roadmap.topic}" unpublished`);
    } catch (err) {
      reportFailure(err, "That change could not be saved.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRoadmap(roadmap: AdminRoadmap) {
    const ok = await confirm({
      title: "Delete this course permanently?",
      message: `"${roadmap.topic}" and its timeline will be erased. Unpublishing is the reversible option — deleting is not.`,
      confirmLabel: "Delete permanently",
      tone: "danger",
    });
    if (!ok) return;

    setBusyId(roadmap.id);
    try {
      await remove.mutateAsync(roadmap.id);
      toast.success(`"${roadmap.topic}" deleted`);
    } catch (err) {
      // The 409 here is the useful one: it names how many learners have it.
      reportFailure(err, "That course could not be deleted.");
    } finally {
      setBusyId(null);
    }
  }

  const items = roadmaps.data?.items ?? [];

  return (
    <Section
      title="Courses"
      description="Everything in the database — curated catalog entries, AI-generated roadmaps and learner-built paths."
    >
      <div className="space-y-3">
        <Input
          label="Search by topic or slug"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="search"
          autoComplete="off"
        />
        <div className="flex flex-wrap gap-3">
          <Select
            label="Subject"
            value={category}
            options={[
              { value: "", label: "All subjects" },
              ...(categories.data ?? []).map((c) => ({ value: c.category, label: c.category })),
            ]}
            onChange={setCategory}
          />
          <Select label="Source" value={source} options={SOURCES} onChange={setSource} />
          <Select
            label="Visibility"
            value={visibility}
            options={VISIBILITY}
            onChange={setVisibility}
          />
          <Select label="Sort" value={sort} options={SORTS} onChange={setSort} />
        </div>
      </div>

      <div className="mt-5">
        {roadmaps.isLoading ? (
          <RecordListSkeleton />
        ) : roadmaps.isError ? (
          <StateView
            tone="error"
            title="Courses could not be loaded"
            description="The server did not answer. Nothing has been changed."
            primary={{ label: "Try again", onClick: () => void roadmaps.refetch() }}
          />
        ) : items.length === 0 ? (
          <StateView
            title="No courses match"
            description="Try a different search term, or clear the subject, source and visibility filters."
            primary={{
              label: "Clear filters",
              onClick: () => {
                setSearch("");
                setCategory("");
                setSource("");
                setVisibility("");
              },
            }}
          />
        ) : (
          <ul className={clsx("space-y-3", roadmaps.isFetching && "opacity-60 transition-opacity")}>
            {items.map((roadmap) => {
              const busy = busyId === roadmap.id;
              return (
                <RecordCard
                  key={roadmap.id}
                  title={
                    <Link
                      href={`/roadmap/${roadmap.slug}`}
                      // Padded on both axes so even a two-word title like
                      // "Flask" is a 48px-tall, >=44px-wide target; the
                      // matching negative margins keep the card layout
                      // byte-identical to an unpadded link.
                      className="-mx-2 -my-3.5 inline-block px-2 py-3.5 transition-colors duration-fast hover:text-md-primary"
                    >
                      {roadmap.topic}
                    </Link>
                  }
                  subtitle={roadmap.summary ?? roadmap.slug}
                  badges={
                    <>
                      <Badge tone={roadmap.published ? "success" : "neutral"}>
                        {roadmap.published ? "Published" : "Hidden"}
                      </Badge>
                      <Badge>{SOURCE_LABEL[roadmap.sourceModel] ?? "AI-generated"}</Badge>
                      {roadmap.category && <Badge>{roadmap.category}</Badge>}
                      {roadmap.brokenResources > 0 && (
                        <Badge tone="warning">
                          {roadmap.brokenResources} failing link
                          {roadmap.brokenResources === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </>
                  }
                  fields={
                    <>
                      <Field label="Stages">{roadmap.stageCount}</Field>
                      <Field label="Est. days">{roadmap.totalDays}</Field>
                      <Field label="Learners">{roadmap.learners}</Field>
                      <Field label="Created">
                        <TimeAgo iso={roadmap.createdAt} />
                      </Field>
                    </>
                  }
                  actions={
                    <>
                      <MdButton
                        variant={roadmap.published ? "outlined" : "tonal"}
                        size="sm"
                        disabled={busy}
                        onClick={() => togglePublished(roadmap)}
                      >
                        {roadmap.published ? "Unpublish" : "Publish"}
                      </MdButton>
                      <MdButton
                        variant="text"
                        size="sm"
                        disabled={busy || roadmap.learners > 0}
                        className="text-md-error"
                        title={
                          roadmap.learners > 0
                            ? "Learners have this saved — unpublish it instead"
                            : undefined
                        }
                        onClick={() => deleteRoadmap(roadmap)}
                      >
                        Delete
                      </MdButton>
                    </>
                  }
                />
              );
            })}
          </ul>
        )}

        {roadmaps.data && (
          <Pager
            page={roadmaps.data.page}
            pages={roadmaps.data.pages}
            total={roadmaps.data.total}
            onChange={setPage}
          />
        )}
      </div>
    </Section>
  );
}
