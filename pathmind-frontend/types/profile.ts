/** Mirrors the `/me/*` response shapes. Keep in step with the backend. */

export interface Education {
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
}

export interface NotificationPrefs {
  productUpdates: boolean;
  roadmapReminders: boolean;
  weeklyDigest: boolean;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  joinedAt: string;
  education: Education | null;
  skills: string[];
  interests: string[];
  notificationPrefs: NotificationPrefs;
  /** False for Google-only accounts, which have no password to change. */
  hasPassword: boolean;
  googleCalendarConnected: boolean;
}

export interface LearningOverview {
  savedRoadmaps: number;
  favoriteRoadmaps: number;
  totalStages: number;
  completedStages: number;
  unlockedStages: number;
  completedRoadmaps: number;
  certificates: number;
  currentStreak: number;
  longestStreak: number;
  overallProgress: number;
  joinedAt: string;
}

export type ActivityType =
  | "stage_completed"
  | "roadmap_saved"
  | "roadmap_generated"
  | "certificate_earned"
  | "achievement_unlocked"
  | "goal_set";

export interface ActivityBucket {
  /** YYYY-MM-DD, UTC. */
  date: string;
  count: number;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string | null;
  subtitle: string | null;
  roadmapId: string | null;
  createdAt: string;
}

export interface ActivityResponse {
  range: "week" | "month";
  buckets: ActivityBucket[];
  feed: ActivityItem[];
}

export type AchievementIcon = "rocket" | "bolt" | "book" | "flame" | "trophy" | "target";

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface Certificate {
  id: string;
  roadmapId: string;
  topic: string;
  recipientName: string;
  stagesCompleted: number;
  serial: string;
  issuedAt: string;
}

export interface Goal {
  id: string;
  roadmapId: string;
  targetDate: string;
  note: string | null;
  achievedAt: string | null;
}

export interface RoadmapProgressSummary {
  roadmapId: string;
  totalStages: number;
  completedStages: number;
  percent: number;
  isComplete: boolean;
  isFavorite: boolean;
  lastActivityAt: string | null;
}
