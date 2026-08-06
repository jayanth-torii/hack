"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, downloadBlob } from "@/lib/api-client";
import { mapRoadmap } from "@/lib/mappers";
import { useRoadmapStore } from "@/store/roadmapStore";
import type { Roadmap } from "@/types/roadmap";
import type { UserProgress } from "@/types/progress";
import { downloadBlobAsFile } from "@/lib/ics";
import { slugify } from "@/lib/slugify";

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
  return useQuery({
    queryKey: ["roadmaps", "saved"],
    queryFn: async () => {
      const res = await apiClient.get<{ roadmaps: unknown[] }>("/roadmaps/saved");
      return res.roadmaps.map(mapRoadmap);
    },
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

      const optimistic: UserProgress = {
        roadmapId,
        completedStageIds: [...new Set([...(previous?.completedStageIds ?? []), stageId])],
        unlockedStageIds: [
          ...new Set([...(previous?.unlockedStageIds ?? []), ...(nextStage ? [nextStage.id] : [])]),
        ],
      };
      queryClient.setQueryData(key, optimistic);
      setProgress(optimistic);
      return { previous };
    },
    onError: (_err, { roadmapId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["progress", roadmapId], context.previous);
        setProgress(context.previous);
      }
    },
    onSuccess: (data) => {
      setProgress(data);
      queryClient.setQueryData(["progress", data.roadmapId], data);
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
        downloadBlobAsFile(`pathmind-${slugify(topic)}.ics`, blob);
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
