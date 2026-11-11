"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAddCourse, useCatalog, useCatalogCategories } from "@/hooks/useCatalogQuery";
import { CourseCard } from "./CourseCard";
import { CoursePreview } from "./CoursePreview";
import { MdButton } from "@/components/md/Button";
import { Input } from "@/components/ui/Input";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { StateView } from "@/components/ui/StateView";
import { Chip, ChipRow } from "@/components/ui/FilterChips";
import { toast } from "@/components/ui/toast";
import { clsx } from "@/lib/clsx";
import type { CatalogCourse, CatalogSort, CourseLevel } from "@/types/catalog";

const SORTS: Array<{ value: CatalogSort; label: string }> = [
  { value: "popular", label: "Most learners" },
  { value: "newest", label: "Newest" },
  { value: "shortest", label: "Shortest first" },
  { value: "longest", label: "Longest first" },
  { value: "alphabetical", label: "A–Z" },
];

const PAGE_SIZE = 12;

/**
 * Debounces the search box.
 *
 * Every keystroke is otherwise a request *and* a new react-query cache entry;
 * at 300ms a typed word is one request instead of eight, and the grid stops
 * flickering between partial result sets.
 */
function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BuildIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h7M4 12h11M4 17h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18 13v7M14.5 16.5h7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The course-selection screen.
 *
 * Catalog state lives in component state rather than the URL. That is a
 * deliberate limit: a filtered view cannot be linked or restored on reload.
 * The trade is that every filter change is instant and never pushes a history
 * entry, so the phone's Back button leaves the catalog instead of walking
 * backwards through eight filter combinations the learner did not think of as
 * navigations.
 */
export function CourseCatalog() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const signedIn = Boolean(user);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<CatalogSort>("popular");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<CatalogCourse | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const debouncedSearch = useDebounced(search);
  const gridTop = useRef<HTMLDivElement>(null);

  const filters = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      category: category ?? undefined,
      sort,
      page,
      limit: PAGE_SIZE,
    }),
    [debouncedSearch, category, sort, page]
  );

  const catalog = useCatalog(filters);
  const categories = useCatalogCategories();
  const addCourse = useAddCourse();

  // Any filter change invalidates the current page number — page 4 of an
  // unfiltered catalog is usually past the end of a filtered one, which would
  // show an empty grid for a search that actually matched.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, sort]);

  const courses = catalog.data?.courses ?? [];
  const total = catalog.data?.total ?? 0;
  const pages = catalog.data?.pages ?? 1;
  const filtered = Boolean(debouncedSearch.trim() || category);

  async function handleAdd(course: CatalogCourse) {
    if (!signedIn) {
      // Come back to the catalog after signing in, not to the home page.
      router.push(`/auth/login?next=${encodeURIComponent("/courses")}`);
      return;
    }
    setAddingId(course.id);
    try {
      await addCourse.mutateAsync(course.id);
      toast.success(`"${course.topic}" added to your library`);
      setPreview(null);
    } catch {
      toast.error("That course could not be added. Check your connection and try again.");
    } finally {
      setAddingId(null);
    }
  }

  function goToPage(next: number) {
    setPage(next);
    gridTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearFilters() {
    setSearch("");
    setCategory(null);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="min-w-0">
        <p className="text-label-lg uppercase tracking-wider text-md-primary">Course catalog</p>
        <h1 className="mt-2 text-headline-md text-md-on-surface sm:text-display-sm">
          Pick a course, or build your own
        </h1>
        <p className="mt-3 max-w-2xl text-body-lg text-md-on-surface-variant">
          Every course here is hand-curated and sequenced — stages unlock in order, and each one
          links to free resources that have been checked. Add one to your library to start, or
          assemble your own path from any stages you like.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/courses/build"
            className="state-layer press inline-flex min-h-touch select-none items-center justify-center gap-2 rounded-full border border-md-outline px-6 text-label-lg font-medium text-md-primary transition-[background-color,border-color] duration-fast ease-standard"
          >
            <span aria-hidden className="shrink-0">
              <BuildIcon />
            </span>
            Build a custom course
          </Link>
        </div>
      </header>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <section aria-label="Filter courses" className="mt-8 min-w-0 space-y-4">
        <Input
          label="Search courses"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={<SearchIcon />}
          type="search"
          autoComplete="off"
          endAdornment={
            search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="state-layer grid h-11 w-11 place-items-center rounded-full"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="m7 7 10 10M17 7 7 17"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : undefined
          }
        />

        <ChipRow label="Category">
          <Chip selected={category === null} onClick={() => setCategory(null)}>
            All subjects
          </Chip>
          {(categories.data ?? []).map((c) => (
            <Chip
              key={c.category}
              selected={category === c.category}
              onClick={() => setCategory(category === c.category ? null : c.category)}
            >
              {c.category}
              <span className="text-label-md opacity-70">{c.count}</span>
            </Chip>
          ))}
        </ChipRow>

        {/* There is deliberately no difficulty filter. Every course in this
            catalog runs beginner → intermediate → advanced, so such a control
            would return all 80 courses or none of them depending on which way
            it was defined — a filter that cannot discriminate is worse than no
            filter, because it tells the learner something false about the
            shape of the catalog. Each card shows its span instead. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-end">
          <label className="flex min-w-0 flex-none items-center gap-2 text-body-sm text-md-on-surface-variant">
            <span className="whitespace-nowrap">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as CatalogSort)}
              className="min-h-touch min-w-0 rounded-sm border border-md-outline bg-md-surface-container px-3 text-body-md text-md-on-surface"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* ── Results ─────────────────────────────────────────────────── */}
      <div ref={gridTop} className="mt-8 scroll-mt-24">
        <p className="text-body-sm text-md-on-surface-variant" aria-live="polite">
          {catalog.isLoading
            ? "Loading courses…"
            : `${total} course${total === 1 ? "" : "s"}${filtered ? " match your filters" : ""}`}
        </p>

        <div className="mt-4">
          {catalog.isLoading ? (
            <CardGridSkeleton count={6} />
          ) : catalog.isError ? (
            <StateView
              tone="error"
              title="The catalog could not be loaded"
              description="Something went wrong reaching the server. Your library and saved courses are unaffected."
              primary={{ label: "Try again", onClick: () => void catalog.refetch() }}
              secondary={{ label: "Go to your library", href: "/saved" }}
            />
          ) : courses.length === 0 ? (
            <StateView
              title={filtered ? "No courses match those filters" : "The catalog is empty"}
              description={
                filtered
                  ? "Try a broader search, a different subject, or clear the filters to see everything."
                  : "No courses have been published yet. Once they are, they will show up here."
              }
              primary={
                filtered
                  ? { label: "Clear filters", onClick: clearFilters }
                  : { label: "Go to your library", href: "/saved" }
              }
              secondary={filtered ? { label: "Build your own", href: "/courses/build" } : undefined}
            />
          ) : (
            <ul
              className={clsx(
                "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
                // The previous page stays on screen while the next loads
                // (keepPreviousData); dimming it is the only signal that what
                // is shown is one request behind.
                catalog.isFetching && "opacity-60 transition-opacity duration-fast"
              )}
            >
              {courses.map((course) => (
                <li key={course.id} className="min-w-0">
                  <CourseCard
                    course={course}
                    onPreview={setPreview}
                    onAdd={handleAdd}
                    adding={addingId === course.id}
                    signedIn={signedIn || isInitializing}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {pages > 1 && (
          <nav
            aria-label="Catalog pages"
            className="mt-8 flex items-center justify-between gap-3"
          >
            <MdButton variant="outlined" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              Previous
            </MdButton>
            <p className="text-body-sm text-md-on-surface-variant" aria-live="polite">
              Page {page} of {pages}
            </p>
            <MdButton
              variant="outlined"
              disabled={page >= pages}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </MdButton>
          </nav>
        )}
      </div>

      <CoursePreview
        course={preview}
        onClose={() => setPreview(null)}
        onAdd={handleAdd}
        adding={Boolean(preview && addingId === preview.id)}
        signedIn={signedIn || isInitializing}
      />
    </div>
  );
}
