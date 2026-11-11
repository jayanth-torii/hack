"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, downloadBlob } from "@/lib/api-client";
import { mapRoadmap } from "@/lib/mappers";
import { useRoadmapStore } from "@/store/roadmapStore";
import { useAuthStore } from "@/store/authStore";
import type { Roadmap } from "@/types/roadmap";
import type { UserProgress } from "@/types/progress";
import { downloadBlobAsFile } from "@/lib/ics";
import { slugify } from "@/lib/slugify";
import { ApiClientError } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

export function useGenerateRoadmap() {
  const setRoadmap = useRoadmapStore((s) => s.setRoadmap);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topic: string) => {
      const res = await apiClient.post<{ roadmap: unknown }>("/roadmaps/generate", { topic });
      return mapRoadmap(res.roadmap);
    },
    onSuccess: (roadmap: Roadmap) => {
      setRoadmap(roadmap);
      queryClient.setQueryData(["roadmap", roadmap.id], roadmap);
    },
  });
}

export function useRoadmap(id: string | undefined) {
  return useQuery({
    queryKey: ["roadmap", id],
    queryFn: async () => {
      const res = await apiClient.get<{ roadmap: unknown }>(`/roadmaps/${id}`);
      return mapRoadmap(res.roadmap);
    },
    enabled: Boolean(id),
  });
}

export function useSavedRoadmaps() {
  // The endpoint requires a session, so asking for it while signed out can
  // only produce a 401. That was harmless while this ran on /saved alone;
  // once the header started resolving a roadmap from it, an unguarded query
  // would have put a failed request on every public landing page view.
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["roadmaps", "saved"],
    queryFn: async () => {
      const res = await apiClient.get<{ roadmaps: unknown[] }>("/roadmaps/saved");
      return res.roadmaps.map(mapRoadmap);
    },
    enabled: Boolean(user),
  });
}

export function useRoadmapProgress(roadmapId: string | undefined) {
  const setProgress = useRoadmapStore((s) => s.setProgress);

  return useQuery({
    queryKey: ["progress", roadmapId],
    queryFn: async () => {
      const res = await apiClient.get<UserProgress>(`/roadmaps/${roadmapId}/progress`);
      const progress = { ...res, roadmapId: roadmapId! };
      setProgress(progress);
      return progress;
    },
    enabled: Boolean(roadmapId),
  });
}

interface UpdateProgressVars {
  roadmapId: string;
  stageId: string;
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  const setProgress = useRoadmapStore((s) => s.setProgress);
  const roadmap = useRoadmapStore((s) => s.currentRoadmap);

  return useMutation({
    mutationFn: async ({ roadmapId, stageId }: UpdateProgressVars) => {
      const res = await apiClient.patch<Omit<UserProgress, "roadmapId">>(
        `/roadmaps/${roadmapId}/progress/${stageId}`
      );
      return { ...res, roadmapId };
    },
    onMutate: async ({ roadmapId, stageId }) => {
      const key = ["progress", roadmapId];
      const previous = queryClient.getQueryData<UserProgress>(key);

      // Optimistically unlock the next sequential stage so the 3D path/
      // dashboard react instantly, without waiting on the network.
      const stages = [...(roadmap?.stages ?? [])].sort((a, b) => a.order - b.order);
      const completingIndex = stages.findIndex((s) => s.id === stageId);
      const nextStage = completingIndex >= 0 ? stages[completingIndex + 1] : undefined;

      // Completing a stage ticks all of its lessons, server-side and here, so
      // the rows inside the card flip with the card rather than a beat later.
      const completingStage = stages[completingIndex];
      const optimistic: UserProgress = {
        roadmapId,
        completedStageIds: [...new Set([...(previous?.completedStageIds ?? []), stageId])],
        unlockedStageIds: [
          ...new Set([...(previous?.unlockedStageIds ?? []), ...(nextStage ? [nextStage.id] : [])]),
        ],
        completedItems: {
          ...(previous?.completedItems ?? {}),
          [stageId]: completingStage
            ? completingStage.syllabus.map((_, index) => index)
            : (previous?.completedItems?.[stageId] ?? []),
        },
      };
      queryClient.setQueryData(key, optimistic);
      setProgress(optimistic);
      return { previous };
    },
    onError: (err, { roadmapId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["progress", roadmapId], context.previous);
        setProgress(context.previous);
      }
      toast.error(
        "Couldn't update progress",
        err instanceof ApiClientError ? err.message : "Please try again."
      );
    },
    onSuccess: (data) => {
      setProgress(data);
      queryClient.setQueryData(["progress", data.roadmapId], data);
      toast.success("Stage complete 🎉", "Your next stage is now unlocked.");
    },
    onSettled: (_data, _err, { roadmapId }) => {
      void queryClient.invalidateQueries({ queryKey: ["progress", roadmapId] });
    },
  });
}

interface ExportCalendarVars {
  roadmapId: string;
  topic: string;
  format: "google" | "ics";
}

export function useExportCalendar() {
  return useMutation({
    mutationFn: async ({ roadmapId, topic, format }: ExportCalendarVars) => {
      if (format === "ics") {
        const blob = await downloadBlob(`/roadmaps/${roadmapId}/export-calendar`, { format });
        downloadBlobAsFile(`vidhyora-${slugify(topic)}.ics`, blob);
        return { format: "ics" as const };
      }
      const result = await apiClient.post<{ eventsCreated: number; eventLinks: string[] }>(
        `/roadmaps/${roadmapId}/export-calendar`,
        { format }
      );
      return { format: "google" as const, ...result };
    },
  });
}

interface ToggleStageItemVars {
  roadmapId: string;
  stageId: string;
  index: number;
  done: boolean;
}

/**
 * Ticks or unticks one syllabus row.
 *
 * Optimistic, because a checkbox that waits on a round trip feels broken. The
 * server owns whether the tick also completed the stage — only its response can
 * unlock the next one — so the optimistic patch deliberately moves the tick and
 * nothing else, and `onSuccess` replaces the whole thing with server truth.
 */
export function useToggleStageItem() {
  const queryClient = useQueryClient();
  const setProgress = useRoadmapStore((s) => s.setProgress);

  return useMutation({
    mutationFn: async ({ roadmapId, stageId, index, done }: ToggleStageItemVars) => {
      const res = await apiClient.put<
        Omit<UserProgress, "roadmapId"> & { stageCompleted: boolean }
      >(`/roadmaps/${roadmapId}/progress/${stageId}/items`, { index, done });
      return { ...res, roadmapId };
    },
    onMutate: async ({ roadmapId, stageId, index, done }) => {
      const key = ["progress", roadmapId];
      const previous = queryClient.getQueryData<UserProgress>(key);
      if (!previous) return { previous };

      const current = previous.completedItems?.[stageId] ?? [];
      const next = done
        ? [...new Set([...current, index])].sort((a, b) => a - b)
        : current.filter((i) => i !== index);

      const optimistic: UserProgress = {
        ...previous,
        completedItems: { ...(previous.completedItems ?? {}), [stageId]: next },
      };
      queryClient.setQueryData(key, optimistic);
      setProgress(optimistic);
      return { previous };
    },
    onError: (err, { roadmapId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["progress", roadmapId], context.previous);
        setProgress(context.previous);
      }
      toast.error(
        "Couldn't save that",
        err instanceof ApiClientError ? err.message : "Please try again."
      );
    },
    onSuccess: ({ stageCompleted, ...data }) => {
      setProgress(data);
      queryClient.setQueryData(["progress", data.roadmapId], data);
      if (stageCompleted) {
        toast.success("Stage complete 🎉", "Your next stage is now unlocked.");
      }
    },
    onSettled: (_data, _err, { roadmapId }) => {
      void queryClient.invalidateQueries({ queryKey: ["progress", roadmapId] });
    },
  });
}
