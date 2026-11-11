"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { mapRoadmap } from "@/lib/mappers";
import type { Roadmap } from "@/types/roadmap";
import type {
  CatalogCategory,
  CatalogFilters,
  CatalogPage,
  CourseDetail,
} from "@/types/catalog";

/** Drops empty/undefined params so the query key is stable across equivalent filters. */
function toSearchParams(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * One page of the catalog.
 *
 * `placeholderData: keepPreviousData` is the point of this hook: without it,
 * typing in the search box or stepping a page unmounts the whole grid back to
 * a skeleton on every keystroke, and the page height collapses and re-expands
 * under the user's thumb. Keeping the previous page on screen while the next
 * one loads is what makes the filters feel like filters rather than
 * navigations.
 */
export function useCatalog(filters: CatalogFilters) {
  return useQuery({
    queryKey: ["catalog", filters],
    queryFn: () => apiClient.get<CatalogPage>(`/courses${toSearchParams(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useCatalogCategories() {
  return useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: async () => {
      const res = await apiClient.get<{ categories: CatalogCategory[] }>("/courses/categories");
      return res.categories;
    },
    // The catalog's shape changes only when courses are seeded or unpublished.
    staleTime: 5 * 60 * 1000,
  });
}

export function useCourseDetail(idOrSlug: string | null) {
  return useQuery({
    queryKey: ["catalog", "course", idOrSlug],
    queryFn: () => apiClient.get<CourseDetail>(`/courses/${idOrSlug}`),
    enabled: Boolean(idOrSlug),
  });
}

/**
 * Adds a catalog course to the library.
 *
 * Invalidates both the catalog (so every card's `saved` flag and learner count
 * refresh) and the saved-roadmaps list the library screen reads, because the
 * same course now has to appear there without a reload.
 */
export function useAddCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      apiClient.post<{ saved: boolean; roadmapId: string }>(`/roadmaps/${courseId}/save`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      void queryClient.invalidateQueries({ queryKey: ["roadmaps", "saved"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useRemoveCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      apiClient.del<{ saved: boolean }>(`/roadmaps/${courseId}/save`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      void queryClient.invalidateQueries({ queryKey: ["roadmaps", "saved"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export interface BuildCoursePayload {
  title: string;
  stages: Array<{ courseId: string; stageId: string }>;
}

/** Builds a personal course out of picked catalog stages. */
export function useBuildCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BuildCoursePayload): Promise<Roadmap> => {
      const res = await apiClient.post<{ roadmap: unknown }>("/courses/custom", payload);
      return mapRoadmap(res.roadmap);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roadmaps", "saved"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
