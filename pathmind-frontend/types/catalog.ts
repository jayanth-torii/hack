/**
 * Wire types for the course catalog and the admin dashboard.
 *
 * These mirror what `pathmind-backend/src/services/catalog.service.ts` and
 * `controllers/admin.controller.ts` return. They are deliberately *not* the
 * `Roadmap` domain type: a catalog card is a projection with derived fields
 * (`totalDays`, `level`, `learners`) that no roadmap document carries, and
 * typing it as a roadmap would invite someone to reach for `stages` that the
 * list endpoint never sends.
 */

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface CatalogCourse {
  id: string;
  topic: string;
  slug: string;
  category: string | null;
  summary: string | null;
  stageCount: number;
  totalDays: number;
  resourceCount: number;
  practiceCount: number;
  level: CourseLevel;
  difficulties: CourseLevel[];
  learners: number;
  saved: boolean;
  createdAt: string;
}

export interface CatalogPage {
  courses: CatalogCourse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CatalogCategory {
  category: string;
  count: number;
  days: number;
}

export type CatalogSort = "popular" | "newest" | "shortest" | "longest" | "alphabetical";

export interface CatalogFilters {
  q?: string;
  category?: string;
  level?: CourseLevel;
  sort?: CatalogSort;
  page?: number;
  limit?: number;
}

/** A stage as the course-detail endpoint returns it. */
export interface CourseStage {
  _id: string;
  order: number;
  title: string;
  type: "learn" | "practice";
  difficulty: CourseLevel;
  estimatedDays: number;
  syllabus: string[];
  freeResources: Array<{ title: string; url: string; type: string; verified: boolean }>;
  practiceLinks: Array<{ title: string; url: string; platform: string }>;
}

export interface CourseDetail {
  course: {
    _id: string;
    topic: string;
    slug: string;
    category: string | null;
    summary: string | null;
    stages: CourseStage[];
  };
  meta: {
    saved: boolean;
    level: CourseLevel;
    difficulties: CourseLevel[];
    totalDays: number;
  };
}

/** One stage the learner has picked in the builder. */
export interface BuilderPick {
  courseId: string;
  courseTopic: string;
  stageId: string;
  title: string;
  difficulty: CourseLevel;
  estimatedDays: number;
  syllabusCount: number;
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminStats {
  users: {
    total: number;
    admins: number;
    suspended: number;
    newLast7Days: number;
    newLast30Days: number;
    activeLast30Days: number;
  };
  roadmaps: {
    total: number;
    curated: number;
    generated: number;
    published: number;
    inUse: number;
  };
  learning: {
    stagesCompleted: number;
    certificatesIssued: number;
    roadmapsCompleted: number;
  };
  resources: { total: number; unverified: number };
  popularTopics: Array<{ topic: string; slug: string; learners: number }>;
  categories: Array<{ category: string; count: number }>;
  activity: Array<{ date: string; count: number }>;
  signups: Array<{ date: string; count: number }>;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: "user" | "admin";
  suspended: boolean;
  suspendedReason: string | null;
  savedCount: number;
  stagesCompleted: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminRoadmap {
  id: string;
  topic: string;
  slug: string;
  category: string | null;
  summary: string | null;
  published: boolean;
  sourceModel: string;
  stageCount: number;
  totalDays: number;
  brokenResources: number;
  learners: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminResource {
  roadmapId: string;
  topic: string;
  slug: string;
  published: boolean;
  stageTitle: string;
  title: string;
  url: string;
  type: string;
  verified: boolean;
  lastVerifiedAt: string;
}

export interface AuditEntry {
  id: string;
  actorEmail: string;
  action: string;
  targetType: "user" | "roadmap";
  targetId: string;
  targetLabel: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface PlatformActivityEntry {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  actorEmail: string;
  createdAt: string;
}
