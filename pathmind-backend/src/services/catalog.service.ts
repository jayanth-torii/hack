import { Types, type FilterQuery } from "mongoose";
import { Roadmap, type RoadmapDocument } from "../models/Roadmap";
import { User } from "../models/User";

/**
 * Read model for the course catalog — the browse-and-pick screen.
 *
 * The catalog never returns whole roadmaps. A course document carries every
 * stage's syllabus, resources, certifications and practice links; a page of
 * two dozen of those is megabytes of JSON the grid cannot use. Everything here
 * is projected down to what a card actually renders, and the stage detail is
 * fetched once, for one course, when the learner opens it.
 */

/** Difficulty of a whole course, derived from its stages. */
export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface CatalogCourse {
  id: string;
  topic: string;
  slug: string;
  category: string | null;
  summary: string | null;
  stageCount: number;
  /** Sum of every stage's estimatedDays — the headline "how long" number. */
  totalDays: number;
  resourceCount: number;
  practiceCount: number;
  level: CourseLevel;
  /** The distinct difficulties present, in ladder order. */
  difficulties: CourseLevel[];
  /** Number of learners with this course in their library. */
  learners: number;
  /** True when the requesting user already has it saved. */
  saved: boolean;
  createdAt: Date;
}

export interface CatalogQuery {
  q?: string;
  category?: string;
  level?: CourseLevel;
  /** Courses whose total estimated days fall at or below this. */
  maxDays?: number;
  sort?: "popular" | "newest" | "shortest" | "longest" | "alphabetical";
  page: number;
  limit: number;
  /** When set, each card reports whether this user already saved it. */
  userId?: string;
}

export interface CatalogPage {
  courses: CatalogCourse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const LEVEL_ORDER: CourseLevel[] = ["beginner", "intermediate", "advanced"];

/**
 * What makes a roadmap a **catalog course**: published *and* categorised.
 *
 * Published alone is not enough. Every AI-generated roadmap is also a public
 * template — that is how the generation cache is shared between learners — so
 * a catalog defined as "public templates" fills with whatever anybody has ever
 * typed into the topic box, uncategorised and unsummarised, and buries the 80
 * curated courses underneath it.
 *
 * A category is therefore the editorial act that puts a course in the catalog.
 * The seeder sets it for curated courses, and an admin can set one on a
 * generated roadmap to promote it — which is a deliberate decision rather than
 * a side effect of someone pressing Generate.
 */
export const CATALOG_FILTER = {
  isPublicTemplate: true,
  category: { $ne: null },
} as const;

/**
 * Escapes a user string for use inside a RegExp.
 *
 * The search box feeds straight into a Mongo $regex, so without this a learner
 * typing "C++" gets a syntax error back, and a pattern like "(a|b){9999}"
 * hands the server catastrophic backtracking.
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A course's level is the **highest** difficulty it reaches, not the lowest.
 *
 * A path that starts at beginner and ends at advanced is an advanced course —
 * filing it under "beginner" would leave someone three stages out of their
 * depth. The full span is returned alongside so a card can show the range
 * rather than only the ceiling.
 */
export function summariseDifficulty(stages: Array<{ difficulty: CourseLevel }>): {
  level: CourseLevel;
  difficulties: CourseLevel[];
} {
  const present = new Set(stages.map((s) => s.difficulty));
  const ordered = LEVEL_ORDER.filter((d) => present.has(d));
  return {
    level: ordered[ordered.length - 1] ?? "beginner",
    difficulties: ordered,
  };
}

/** The projection every catalog read uses — stage bodies deliberately excluded. */
const CARD_PROJECTION = {
  topic: 1,
  slug: 1,
  category: 1,
  summary: 1,
  createdAt: 1,
  "stages.difficulty": 1,
  "stages.estimatedDays": 1,
  "stages.freeResources.url": 1,
  "stages.practiceLinks.url": 1,
} as const;

interface CardRow {
  _id: Types.ObjectId;
  topic: string;
  slug: string;
  category?: string | null;
  summary?: string | null;
  createdAt: Date;
  stages: Array<{
    difficulty: CourseLevel;
    estimatedDays: number;
    freeResources?: unknown[];
    practiceLinks?: unknown[];
  }>;
}

function toCard(row: CardRow, learners: number, saved: boolean): CatalogCourse {
  const stages = row.stages ?? [];
  const { level, difficulties } = summariseDifficulty(stages);
  return {
    id: row._id.toString(),
    topic: row.topic,
    slug: row.slug,
    category: row.category ?? null,
    summary: row.summary ?? null,
    stageCount: stages.length,
    totalDays: stages.reduce((n, s) => n + (s.estimatedDays ?? 0), 0),
    resourceCount: stages.reduce((n, s) => n + (s.freeResources?.length ?? 0), 0),
    practiceCount: stages.reduce((n, s) => n + (s.practiceLinks?.length ?? 0), 0),
    level,
    difficulties,
    learners,
    saved,
    createdAt: row.createdAt,
  };
}

/**
 * One page of the catalog.
 *
 * Level and duration are properties *of the stage array*, so neither can be
 * expressed as a plain Mongo match on the document. Both are applied after
 * projection, in memory — correct, but it means those two filters page over
 * the matched set rather than the whole collection. The catalog is a curated
 * set in the low hundreds, so that is a cheap and honest trade; past a few
 * thousand courses, level and totalDays want denormalising onto the document
 * at seed time.
 */
export async function listCatalog(query: CatalogQuery): Promise<CatalogPage> {
  const filter: FilterQuery<RoadmapDocument> = { ...CATALOG_FILTER };

  if (query.category) filter.category = query.category;

  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q.trim()), "i");
    filter.$or = [{ topic: rx }, { summary: rx }, { category: rx }];
  }

  const rows = (await Roadmap.find(filter).select(CARD_PROJECTION).lean()) as unknown as CardRow[];

  // Learner counts for every matched course in one query, rather than one
  // countDocuments per card.
  const ids = rows.map((r) => r._id);
  const counts = await User.aggregate<{ _id: Types.ObjectId; learners: number }>([
    { $unwind: "$savedRoadmaps" },
    { $match: { savedRoadmaps: { $in: ids } } },
    { $group: { _id: "$savedRoadmaps", learners: { $sum: 1 } } },
  ]);
  const learnerMap = new Map(counts.map((c) => [c._id.toString(), c.learners]));

  let savedSet = new Set<string>();
  if (query.userId) {
    const user = await User.findById(query.userId).select("savedRoadmaps").lean();
    savedSet = new Set((user?.savedRoadmaps ?? []).map((id) => id.toString()));
  }

  let cards = rows.map((row) =>
    toCard(row, learnerMap.get(row._id.toString()) ?? 0, savedSet.has(row._id.toString()))
  );

  if (query.level) cards = cards.filter((c) => c.level === query.level);
  const maxDays = query.maxDays;
  if (maxDays !== undefined) cards = cards.filter((c) => c.totalDays <= maxDays);

  const sort = query.sort ?? "popular";
  cards.sort((a, b) => {
    switch (sort) {
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime();
      case "shortest":
        return a.totalDays - b.totalDays || a.topic.localeCompare(b.topic);
      case "longest":
        return b.totalDays - a.totalDays || a.topic.localeCompare(b.topic);
      case "alphabetical":
        return a.topic.localeCompare(b.topic);
      case "popular":
      default:
        // Ties break alphabetically so a catalog nobody has saved yet still
        // has a stable order across pages instead of Mongo's natural one.
        return b.learners - a.learners || a.topic.localeCompare(b.topic);
    }
  });

  const total = cards.length;
  const start = (query.page - 1) * query.limit;
  return {
    courses: cards.slice(start, start + query.limit),
    total,
    page: query.page,
    limit: query.limit,
    pages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export interface CatalogCategory {
  category: string;
  count: number;
  /** Total estimated days across the category's courses. */
  days: number;
}

/** Categories with their course counts, for the filter row. */
export async function listCategories(): Promise<CatalogCategory[]> {
  const rows = await Roadmap.aggregate<{ _id: string; count: number; days: number }>([
    { $match: { isPublicTemplate: true, category: { $ne: null } } },
    { $project: { category: 1, days: { $sum: "$stages.estimatedDays" } } },
    { $group: { _id: "$category", count: { $sum: 1 }, days: { $sum: "$days" } } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ category: r._id, count: r.count, days: r.days }));
}
