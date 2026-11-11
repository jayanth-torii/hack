"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  AdminResource,
  AdminRoadmap,
  AdminStats,
  AdminUser,
  AuditEntry,
  Paged,
  PlatformActivityEntry,
} from "@/types/catalog";

/**
 * Serialises a filter object, dropping empty values so an untouched filter
 * never appears in the URL — and so two equivalent filter states produce the
 * same react-query cache key.
 *
 * Typed as a readonly index signature rather than `Record<...>` so the named
 * filter interfaces below can be passed directly: TypeScript will not assign
 * an interface to a `Record` without an index signature of its own.
 */
function qs(params: { readonly [key: string]: string | number | undefined }): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const out = search.toString();
  return out ? `?${out}` : "";
}

/**
 * Admin reads are short-lived on purpose.
 *
 * The dashboard's whole job is to show the current state of the platform, and
 * a 30-second default stale time (the app-wide setting) would let an admin
 * suspend an account and still see it listed as active. Ten seconds is short
 * enough to feel live without turning a background tab into a polling client.
 */
const ADMIN_STALE_TIME = 10_000;

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await apiClient.get<{ stats: AdminStats }>("/admin/stats");
      return res.stats;
    },
    staleTime: ADMIN_STALE_TIME,
    // A non-admin gets a 403 that no amount of retrying will fix.
    retry: false,
  });
}

export type AdminUsersFilters = {
  q?: string;
  role?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

export function useAdminUsers(filters: AdminUsersFilters) {
  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => apiClient.get<Paged<AdminUser>>(`/admin/users${qs(filters)}`),
    placeholderData: keepPreviousData,
    staleTime: ADMIN_STALE_TIME,
    retry: false,
  });
}

export interface AdminUserUpdate {
  id: string;
  role?: "user" | "admin";
  suspended?: boolean;
  suspendedReason?: string;
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: AdminUserUpdate) =>
      apiClient.patch<{ user: AdminUser }>(`/admin/users/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.del<{ deleted: boolean }>(`/admin/users/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export type AdminRoadmapsFilters = {
  q?: string;
  category?: string;
  source?: string;
  visibility?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

export function useAdminRoadmaps(filters: AdminRoadmapsFilters) {
  return useQuery({
    queryKey: ["admin", "roadmaps", filters],
    queryFn: () => apiClient.get<Paged<AdminRoadmap>>(`/admin/roadmaps${qs(filters)}`),
    placeholderData: keepPreviousData,
    staleTime: ADMIN_STALE_TIME,
    retry: false,
  });
}

export interface AdminRoadmapUpdate {
  id: string;
  isPublicTemplate?: boolean;
  category?: string;
  summary?: string;
}

export function useUpdateAdminRoadmap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: AdminRoadmapUpdate) =>
      apiClient.patch<{ roadmap: AdminRoadmap }>(`/admin/roadmaps/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      // The public catalog's contents just changed too.
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

export function useDeleteAdminRoadmap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.del<{ deleted: boolean }>(`/admin/roadmaps/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

export function useAdminResources(filters: { status?: string; q?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin", "resources", filters],
    queryFn: () => apiClient.get<Paged<AdminResource>>(`/admin/resources${qs(filters)}`),
    placeholderData: keepPreviousData,
    staleTime: ADMIN_STALE_TIME,
    retry: false,
  });
}

export function useAdminAudit(filters: { action?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin", "audit", filters],
    queryFn: () => apiClient.get<Paged<AuditEntry>>(`/admin/audit${qs(filters)}`),
    placeholderData: keepPreviousData,
    staleTime: ADMIN_STALE_TIME,
    retry: false,
  });
}

export function useAdminActivity(filters: { page?: number }) {
  return useQuery({
    queryKey: ["admin", "activity", filters],
    queryFn: () => apiClient.get<Paged<PlatformActivityEntry>>(`/admin/activity${qs(filters)}`),
    placeholderData: keepPreviousData,
    staleTime: ADMIN_STALE_TIME,
    retry: false,
  });
}
