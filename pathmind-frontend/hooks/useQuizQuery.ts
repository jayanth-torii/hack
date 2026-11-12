"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/** One question as the server sends it — the correct index is never included. */
export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export interface QuizPaper {
  /** Opaque 24-hex seed the attempt must be submitted with; it is what the
   *  server regenerates the same paper from in order to score it. */
  seed: string;
  total: number;
  passMark: number;
  alreadyPassed: boolean;
  questions: QuizQuestion[];
}

export interface QuizReviewRow {
  id: string;
  prompt: string;
  correct: boolean;
  /** The option text that was right — only useful on a miss. */
  answer: string;
}

export interface QuizResult {
  correct: number;
  total: number;
  passed: boolean;
  passMark: number;
  attempts: number;
  review: QuizReviewRow[];
}

export interface QuizAnswer {
  id: string;
  answerIndex: number;
}

/**
 * Fetches a fresh paper for a roadmap.
 *
 * `enabled` keeps this off until the quiz is actually opened: the endpoint 400s
 * on an unfinished or too-short course, so an eager fetch would put a failed
 * request on every roadmap page view just to have an answer ready for a dialog
 * most learners never open.
 *
 * `attempt` is part of the key so that "retake" can ask for a genuinely new
 * paper — a plain refetch would reuse the cached seed and serve the same ten
 * questions. `staleTime: Infinity` + no retry is deliberate for the same
 * reason: a background refetch mid-attempt would swap the seed out from under
 * answers already given, and the 400s here are permanent for this course state,
 * not transient.
 */
export function useQuizPaper(roadmapId: string | undefined, enabled: boolean, attempt = 0) {
  return useQuery({
    queryKey: ["quiz", roadmapId, attempt],
    queryFn: () => apiClient.get<QuizPaper>(`/roadmaps/${roadmapId}/quiz`),
    enabled: Boolean(roadmapId) && enabled,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

interface SubmitQuizVars {
  roadmapId: string;
  seed: string;
  answers: QuizAnswer[];
}

/**
 * Scores an attempt. A pass is what unlocks the certificate server-side, so on
 * a pass the certificate list and the roadmap itself are both stale the moment
 * this resolves.
 */
export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roadmapId, seed, answers }: SubmitQuizVars) =>
      apiClient.post<QuizResult>(`/roadmaps/${roadmapId}/quiz`, { seed, answers }),
    onSuccess: (result, { roadmapId }) => {
      if (!result.passed) return;
      // The profile stores certificates under ["me", "certificates"]; the bare
      // ["certificates"] key is invalidated too so any future list keyed that
      // way picks the new one up without this needing to be revisited.
      void queryClient.invalidateQueries({ queryKey: ["certificates"] });
      void queryClient.invalidateQueries({ queryKey: ["me", "certificates"] });
      void queryClient.invalidateQueries({ queryKey: ["roadmap", roadmapId] });
      void queryClient.invalidateQueries({ queryKey: ["progress", roadmapId] });
    },
  });
}
