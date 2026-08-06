import type { Certification, PracticeLink, Resource } from "./resource";
// (import type — safe for circular reference with resource.ts, which imports Difficulty back from here)

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type StageType = "learn" | "practice";

export interface TimelineDay {
  day: number;
  tasks: string[];
}

export interface Stage {
  id: string;
  order: number;
  title: string;
  type: StageType;
  difficulty: Difficulty;
  syllabus: string[];
  resources: Resource[];
  certifications: Certification[];
  practiceLinks: PracticeLink[];
  estimatedDays: number;
  prerequisiteStageId: string | null;
  /** 3D anchor along the roadmap curve, derived client-side from `order` if the API doesn't send one */
  position: [number, number, number];
}

export interface Roadmap {
  id: string;
  topic: string;
  slug: string;
  createdAt: string;
  stages: Stage[];
  suggestedTimeline: TimelineDay[];
}
