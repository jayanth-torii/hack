/**
 * Curated course catalog seeder — the NON-AI path into the `Roadmap` model.
 *
 * Reads every `*.json` file in `src/data/courses/` (see the README there for
 * the contract), validates it with `courseFileSchema`, maps each course onto a
 * public-template Roadmap and writes it to Mongo.
 *
 *   npm run seed:courses -- --dry-run         validate + map, write nothing (no DB needed)
 *   npm run seed:courses                      create what's missing, sync fields on what exists
 *   npm run seed:courses -- --force           replace existing curated templates in place
 *   npm run seed:courses -- --dir <path>      read a different catalog directory
 *
 * Idempotent: a course whose `normalizedTopic` already exists as a public
 * template is never re-created. Without `--force` it gets an in-place,
 * field-level update of the authored fields that carry no identity — category,
 * summary and certifications — and is otherwise left alone. That path exists
 * because `--force` uses `replaceOne`, which mints fresh stage `_id`s and so
 * orphans every learner's per-stage progress; shipping a new authored field
 * must never cost that.
 */
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import mongoose, { Types } from "mongoose";
import {
  Roadmap,
  type Certification,
  type Stage,
  type TimelineDay,
} from "../models/Roadmap";
import { resolvePracticeLinks } from "../services/practiceLinks/practiceLinks.service";
import { normalizeTopic, slugify } from "./slugify";
import {
  courseFileSchema,
  formatCourseIssues,
  formatIssuePath,
  type Course,
  type CourseStage,
} from "../schemas/course.schema";

export const DEFAULT_COURSES_DIR = path.resolve(__dirname, "../data/courses");

export interface CourseRoadmapInput {
  topic: string;
  normalizedTopic: string;
  slug: string;
  /** Carried onto the model so the catalog can group and filter by it. */
  category: string;
  summary: string;
  isPublicTemplate: true;
  sourceModel: "curated";
  stages: Stage[];
  suggestedTimeline: TimelineDay[];
}

/**
 * Splits `items` into `buckets` contiguous, near-even groups. The first
 * `items.length % buckets` groups get one extra item; when there are fewer
 * items than buckets the trailing groups come back empty.
 */
export function distribute<T>(items: T[], buckets: number): T[][] {
  const out: T[][] = [];
  const base = Math.floor(items.length / buckets);
  const remainder = items.length % buckets;
  let cursor = 0;
  for (let i = 0; i < buckets; i++) {
    const size = base + (i < remainder ? 1 : 0);
    out.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return out;
}

/**
 * One `{ day, tasks }` entry per day, days numbered sequentially (1-based)
 * across the whole roadmap. Each stage's syllabus is spread over that stage's
 * `estimatedDays`; a day that would otherwise be empty gets a review task so
 * the timeline never contains a blank day.
 */
export function buildTimeline(stages: CourseStage[]): TimelineDay[] {
  const timeline: TimelineDay[] = [];
  let day = 1;
  for (const stage of stages) {
    for (const chunk of distribute(stage.syllabus, stage.estimatedDays)) {
      timeline.push({
        day,
        tasks: chunk.length > 0 ? chunk : [`Review and practice: ${stage.title}`],
      });
      day++;
    }
  }
  return timeline;
}

/**
 * The certifications the FINAL stage of `course` should carry. Shared by the
 * create path (`courseToRoadmapInput`) and the in-place update path so the two
 * cannot drift: whatever a fresh seed would write is exactly what an existing
 * course is synced to. `rank` is the authored order, so the list stays in the
 * order a human put it in.
 */
export function buildStageCertifications(course: Course, now: Date = new Date()): Certification[] {
  return course.certifications.map((cert, rank) => ({
    title: cert.title,
    provider: cert.provider,
    url: cert.url,
    price: cert.price,
    rank,
    lastVerifiedAt: now,
  }));
}

/**
 * Compares two certification lists by the fields the catalog actually authors,
 * deliberately ignoring `lastVerifiedAt`.
 *
 * That timestamp is minted fresh on every run, so comparing it would make the
 * seeder report a change on every pass and rewrite rows that are identical.
 * Ignoring it is what makes the sync idempotent; the stored timestamp is only
 * refreshed when some authored field really moved.
 */
export function certificationsMatch(
  current: readonly Certification[],
  next: readonly Certification[]
): boolean {
  if (current.length !== next.length) return false;
  return current.every((cert, i) => {
    const other = next[i]!;
    return (
      cert.title === other.title &&
      cert.provider === other.provider &&
      cert.url === other.url &&
      // Mongoose defaults a missing price to null; treat undefined the same.
      (cert.price ?? null) === (other.price ?? null) &&
      cert.rank === other.rank
    );
  });
}

/** A stage as far as certification syncing is concerned — see `syncStageCertifications`. */
export type CertifiableStage = Pick<Stage, "order" | "certifications">;

/**
 * Syncs `course`'s certifications onto an EXISTING roadmap's stages in place,
 * returning whether anything actually changed.
 *
 * Only the `certifications` array of a stage is ever touched: stage `_id`s,
 * `freeResources`, `practiceLinks`, syllabus and the timeline are left exactly
 * as stored, which is what keeps every learner's per-stage progress resolving.
 * (A `--force` `replaceOne` would rebuild the stages from scratch and break
 * those links — far too high a price for syncing one authored field.)
 *
 * Stages are addressed by their stored `order` rather than their array
 * position, because `order` is the field the rest of the app reasons about;
 * the array index is only a fallback for a document that somehow lacks a
 * matching `order`. Every non-target stage is cleared, so moving the
 * certifications — e.g. after a stage is appended to the course — does not
 * leave a stale copy behind on the stage that used to hold them.
 */
export function syncStageCertifications(
  stages: CertifiableStage[],
  course: Course,
  now: Date = new Date()
): boolean {
  if (stages.length === 0) return false;

  const targetOrder = course.stages.length - 1;
  const byOrder = stages.findIndex((stage) => stage.order === targetOrder);
  const targetIndex = byOrder === -1 ? stages.length - 1 : byOrder;

  const desired = buildStageCertifications(course, now);

  let changed = false;
  stages.forEach((stage, index) => {
    const next = index === targetIndex ? desired : [];
    if (certificationsMatch(stage.certifications ?? [], next)) return;
    stage.certifications = next;
    changed = true;
  });
  return changed;
}

/**
 * Pure mapping from a validated catalog course to a Roadmap-shaped document.
 * No DB access — the caller supplies a DB-unique `slug` (see `uniqueSlug`).
 */
export function courseToRoadmapInput(
  course: Course,
  slug: string = slugify(course.topic),
  now: Date = new Date()
): CourseRoadmapInput {
  // One ObjectId per stage up front so the prerequisite chain can point at the
  // previous stage without a second pass.
  const stageIds = course.stages.map(() => new Types.ObjectId());

  const stages: Stage[] = course.stages.map((stage, index) => ({
    _id: stageIds[index]!,
    order: index,
    title: stage.title,
    type: stage.type,
    difficulty: stage.difficulty,
    prerequisiteStageId: index === 0 ? null : stageIds[index - 1]!,
    syllabus: stage.syllabus,
    estimatedDays: stage.estimatedDays,
    freeResources: stage.resources.map((r) => ({
      title: r.title,
      url: r.url,
      type: r.type,
      lastVerifiedAt: now,
      verified: true,
    })),
    // Course-level in the catalog file, attached to the final stage here —
    // that is the point a learner would actually sit the exam, and the
    // frontend aggregates across stages anyway.
    certifications:
      index === course.stages.length - 1 ? buildStageCertifications(course, now) : [],
    practiceLinks:
      stage.type === "practice" && stage.practiceTags && stage.practiceTags.length > 0
        ? resolvePracticeLinks(
            stage.practiceTags.map((tag) => ({ tag, difficulty: stage.difficulty }))
          )
        : [],
  }));

  return {
    topic: course.topic,
    normalizedTopic: normalizeTopic(course.topic),
    slug,
    category: course.category,
    summary: course.summary,
    isPublicTemplate: true,
    sourceModel: "curated",
    stages,
    suggestedTimeline: buildTimeline(course.stages),
  };
}

/** A validated course plus the file it came from, for error reporting. */
export interface LoadedCourse {
  course: Course;
  file: string;
}

/** Thrown for anything a catalog author can fix; printed without a stack. */
export class CatalogError extends Error {}

/**
 * Reads + validates every `*.json` file in `dir` and fails fast on a duplicate
 * topic across files. Errors name the file and the JSON path of each issue.
 */
export function loadCourses(dir: string): LoadedCourse[] {
  if (!fs.existsSync(dir)) {
    throw new CatalogError(`Course catalog directory not found: ${dir}`);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .sort();

  if (files.length === 0) {
    throw new CatalogError(
      `No *.json catalog files in ${dir}. Nothing to seed — add course files first.`
    );
  }

  const loaded: LoadedCourse[] = [];
  const seenTopics = new Map<string, string>(); // normalizedTopic -> file

  for (const file of files) {
    const fullPath = path.join(dir, file);

    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    } catch (err) {
      throw new CatalogError(
        `${file}: not valid JSON — ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const parsed = courseFileSchema.safeParse(raw);
    if (!parsed.success) {
      const lines = formatCourseIssues(parsed.error).map((l) => `  ${l}`);
      throw new CatalogError(`${file}: ${lines.length} validation error(s)\n${lines.join("\n")}`);
    }

    parsed.data.forEach((course, index) => {
      const key = normalizeTopic(course.topic);
      const otherFile = seenTopics.get(key);
      if (otherFile) {
        throw new CatalogError(
          `${file}: ${formatIssuePath([index, "topic"])} — duplicate topic "${course.topic}", ` +
            `already defined in ${otherFile}. Topics must be unique across the whole catalog.`
        );
      }
      seenTopics.set(key, file);
      loaded.push({ course, file });
    });
  }

  return loaded;
}

/**
 * Same guard as `uniqueSlug` in roadmap.service.ts: slugify, then suffix until
 * the slug is free (two differently-cased topics can slugify identically).
 */
async function uniqueSlug(topic: string, taken: Set<string>): Promise<string> {
  const base = slugify(topic);
  let candidate = base;
  let suffix = 1;
  while (taken.has(candidate) || (await Roadmap.exists({ slug: candidate }))) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }
  taken.add(candidate);
  return candidate;
}

/* -------------------------------------------------------------------------- */
/* CLI                                                                         */
/* -------------------------------------------------------------------------- */

interface Options {
  dir: string;
  dryRun: boolean;
  force: boolean;
}

export function parseArgs(argv: string[]): Options {
  const opts: Options = { dir: DEFAULT_COURSES_DIR, dryRun: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--force") opts.force = true;
    else if (arg === "--dir") {
      const value = argv[++i];
      if (!value) throw new CatalogError("--dir requires a directory path");
      opts.dir = path.resolve(value);
    } else if (arg && arg.startsWith("--dir=")) {
      opts.dir = path.resolve(arg.slice("--dir=".length));
    } else if (arg) {
      throw new CatalogError(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmind";

  const loaded = loadCourses(opts.dir);
  console.log(`Catalog: ${loaded.length} course(s) from ${opts.dir}`);

  if (opts.dryRun) {
    // Map everything so a bad course still blows up here, then write nothing.
    for (const { course, file } of loaded) {
      const mapped = courseToRoadmapInput(course);
      const practiceLinks = mapped.stages.reduce((n, s) => n + s.practiceLinks.length, 0);
      const certifications = mapped.stages.reduce((n, s) => n + s.certifications.length, 0);
      console.log(
        `  [dry-run] ${course.topic}  (${file})  slug=${mapped.slug}  ` +
          `stages=${mapped.stages.length}  days=${mapped.suggestedTimeline.length}  ` +
          `practiceLinks=${practiceLinks}  certs=${certifications}`
      );
    }
    console.log(`Dry run — no database connection made, nothing written.`);
    console.log(
      `created 0, metadata-updated 0, certifications-updated 0, skipped 0, replaced 0 ` +
        `(dry run: ${loaded.length} validated)`
    );
    return;
  }

  await mongoose.connect(MONGO_URI);
  // Never log MONGO_URI — it carries credentials.
  console.log("Connected to MongoDB for course seeding");

  let created = 0;
  let skipped = 0;
  let replaced = 0;
  let updatedMeta = 0;
  let updatedCerts = 0;
  const takenSlugs = new Set<string>();

  try {
    for (const { course } of loaded) {
      const normalizedTopic = normalizeTopic(course.topic);
      const existing = await Roadmap.findOne({ normalizedTopic, isPublicTemplate: true });

      if (existing && !opts.force) {
        // In-place update path: every write below is field-level on the stored
        // document. Category and summary are pure metadata, and certifications
        // live inside a stage but carry no identity of their own — no _id,
        // nothing UserProgress keys off. So an existing course can be brought
        // up to date without the `--force` replace, which would mint new stage
        // _ids and orphan every learner's progress.
        let dirty = false;

        if (existing.category !== course.category || existing.summary !== course.summary) {
          existing.category = course.category;
          existing.summary = course.summary;
          console.log(`  metadata  ${course.topic} (category/summary updated)`);
          updatedMeta++;
          dirty = true;
        }

        if (syncStageCertifications(existing.stages, course)) {
          // Reassigning an array nested inside a subdocument is not always
          // picked up by mongoose's change tracking, so say so explicitly.
          existing.markModified("stages");
          console.log(
            `  certs     ${course.topic} ` +
              `(${course.certifications.length} certification(s) on the final stage)`
          );
          updatedCerts++;
          dirty = true;
        }

        // One save for both, and none at all when nothing moved — that is what
        // makes a second run report everything as skipped.
        if (dirty) {
          await existing.save();
          continue;
        }

        console.log(`  skipped   ${course.topic} (already a public template)`);
        skipped++;
        continue;
      }

      if (existing) {
        // Keep the _id and slug so saved-roadmap references stay valid. Stage
        // _ids are regenerated, so per-stage UserProgress for this topic will
        // no longer resolve — that's the point of --force.
        const input = courseToRoadmapInput(course, existing.slug);
        await Roadmap.replaceOne({ _id: existing._id }, input);
        console.log(`  replaced  ${course.topic} (slug=${existing.slug})`);
        replaced++;
        continue;
      }

      const slug = await uniqueSlug(course.topic, takenSlugs);
      const input = courseToRoadmapInput(course, slug);
      await Roadmap.create(input);
      console.log(`  created   ${course.topic} (slug=${slug})`);
      created++;
    }
  } finally {
    await mongoose.disconnect();
  }

  console.log(
    `created ${created}, metadata-updated ${updatedMeta}, ` +
      `certifications-updated ${updatedCerts}, skipped ${skipped}, replaced ${replaced}`
  );
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      if (err instanceof CatalogError) {
        console.error(`\nCourse catalog error:\n${err.message}\n`);
      } else {
        console.error(err);
      }
      process.exit(1);
    });
}
