import type { Difficulty } from "./roadmap";

export type ResourceType = "video" | "playlist" | "doc" | "blog";
export type CertProvider = "coursera" | "udemy" | "aws" | "google" | "microsoft" | "other";
export type PracticePlatform = "leetcode" | "codechef" | "hackerrank";

export interface Resource {
  title: string;
  url: string;
  type: ResourceType;
  /** ISO timestamp — drives the FreshnessBadge */
  lastVerifiedAt: string;
  verified: boolean;
}

export interface Certification {
  title: string;
  provider: CertProvider;
  url: string;
  price: number | null;
  rank: number;
  lastVerifiedAt: string;
}

export interface PracticeLink {
  platform: PracticePlatform;
  problemId: string;
  title: string;
  url: string;
  difficulty: Difficulty;
  verified: boolean;
}
