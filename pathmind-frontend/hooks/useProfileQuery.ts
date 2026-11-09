"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClientError, apiClient, downloadFile } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import type {
  Achievement,
  ActivityResponse,
  Certificate,
  Education,
  Goal,
  LearningOverview,
  NotificationPrefs,
  Profile,
  RoadmapProgressSummary,
} from "@/types/profile";

/* ── Reads ──────────────────────────────────────────────────────────────── */

export function useProfile() {
  return useQuery({
    queryKey: ["me", "profile"],
    queryFn: async () => (await apiClient.get<{ profile: Profile }>("/me/profile")).profile,
  });
}

export function useOverview() {
  return useQuery({
    queryKey: ["me", "overview"],
    queryFn: async () =>
      (await apiClient.get<{ overview: LearningOverview }>("/me/overview")).overview,
  });
}

export function useActivity(range: "week" | "month") {
  return useQuery({
    queryKey: ["me", "activity", range],
    queryFn: async () => apiClient.get<ActivityResponse>(`/me/activity?range=${range}`),
    // Keeps the chart on screen while a range switch refetches, instead of
    // collapsing to a skeleton and shifting the layout.
    placeholderData: (previous) => previous,
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ["me", "achievements"],
    queryFn: async () =>
      (await apiClient.get<{ achievements: Achievement[] }>("/me/achievements")).achievements,
  });
}

export function useCertificates() {
  return useQuery({
    queryKey: ["me", "certificates"],
    queryFn: async () =>
      (await apiClient.get<{ certificates: Certificate[] }>("/me/certificates")).certificates,
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["me", "goals"],
    queryFn: async () => (await apiClient.get<{ goals: Goal[] }>("/me/goals")).goals,
  });
}

/**
 * Per-roadmap completion for the whole library in one request — the saved page
 * would otherwise need one `/roadmaps/:id/progress` call per card.
 */
export function useProgressSummary() {
  return useQuery({
    queryKey: ["me", "progress-summary"],
    queryFn: async () =>
      (await apiClient.get<{ summary: RoadmapProgressSummary[] }>("/me/progress-summary")).summary,
  });
}

/* ── Writes ─────────────────────────────────────────────────────────────── */

/** Surfaces the server's own message; never a raw status code. */
function reportError(fallback: string) {
  return (err: unknown) => {
    const message = err instanceof ApiClientError ? err.message : fallback;
    toast.error(fallback, message);
  };
}

export interface ProfilePatch {
  name?: string;
  education?: Education;
  skills?: string[];
  interests?: string[];
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => apiClient.patch<unknown>("/me/profile", patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me", "profile"] });
      toast.success("Profile updated");
    },
    onError: reportError("Couldn't save your profile"),
  });
}

export function useUpdateNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<NotificationPrefs>) =>
      apiClient.patch<{ notificationPrefs: NotificationPrefs }>("/me/notifications", patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me", "profile"] });
    },
    onError: reportError("Couldn't update your preferences"),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      apiClient.post<{ ok: boolean }>("/auth/change-password", input),
    onSuccess: () => toast.success("Password changed", "Use it next time you sign in."),
    onError: reportError("Couldn't change your password"),
  });
}

export function useSetGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { roadmapId: string; targetDate: string; note?: string }) =>
      apiClient.put<{ goal: Goal }>(`/me/goals/${input.roadmapId}`, {
        targetDate: input.targetDate,
        ...(input.note ? { note: input.note } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me", "goals"] });
      void queryClient.invalidateQueries({ queryKey: ["me", "activity"] });
      toast.success("Target date set");
    },
    onError: reportError("Couldn't set that target date"),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roadmapId: string) => apiClient.del<{ ok: boolean }>(`/me/goals/${roadmapId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me", "goals"] });
      toast.success("Target date removed");
    },
    onError: reportError("Couldn't remove that target date"),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roadmapId: string) =>
      apiClient.put<{ favorite: boolean }>(`/roadmaps/${roadmapId}/favorite`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me", "progress-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["roadmaps", "saved"] });
    },
    onError: reportError("Couldn't update your favourites"),
  });
}

export function useUnsaveRoadmap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roadmapId: string) =>
      apiClient.del<{ saved: boolean }>(`/roadmaps/${roadmapId}/save`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roadmaps", "saved"] });
      void queryClient.invalidateQueries({ queryKey: ["me", "progress-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["me", "overview"] });
      toast.success("Removed from your library", "Your progress is kept if you save it again.");
    },
    onError: reportError("Couldn't remove that roadmap"),
  });
}

export function useIssueCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roadmapId: string) =>
      apiClient.post<{ certificate: Certificate }>(`/roadmaps/${roadmapId}/certificate`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me", "certificates"] });
      void queryClient.invalidateQueries({ queryKey: ["me", "achievements"] });
      void queryClient.invalidateQueries({ queryKey: ["me", "activity"] });
      toast.success("Certificate earned 🎉", "Download it from your profile.");
    },
    // The common failure here is "finish every stage first", which the server
    // words precisely — so show that rather than a generic message.
    onError: reportError("Certificate not available yet"),
  });
}

export function useDownloadCertificate() {
  return useMutation({
    mutationFn: (certificate: Pick<Certificate, "id" | "topic">) =>
      downloadFile(
        `/me/certificates/${certificate.id}/download`,
        `vidhyora-${certificate.topic}-certificate.pdf`
      ),
    onError: reportError("Couldn't download that certificate"),
  });
}
