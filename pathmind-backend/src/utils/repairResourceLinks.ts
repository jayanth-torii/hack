/**
 * Repairs free-resource URLs that are already stored in the database.
 *
 *   npm run resources:repair -- --dry-run
 *   npm run resources:repair
 *
 * Two separate problems, one pass:
 *
 * 1. **Fabricated links in generated roadmaps.** In MOCK_MODE the mock search
 *    provider used to mint a plausible URL from a hash of the query — an
 *    11-character YouTube id, a freeCodeCamp article slug. Those are
 *    syntactically perfect and semantically fictional, and 126 of them were
 *    persisted and then listed in the admin Resources tab as healthy links.
 *    `webSearch.ts` no longer mints them; this rewrites the ones already
 *    written, to a search URL on the same site for the same subject.
 *
 * 2. **Curated links that moved.** Three URLs in `src/data/courses/*.json`
 *    started returning 404/403. The JSON is fixed, but re-seeding those
 *    courses needs `--force`, which does a `replaceOne` that mints new stage
 *    ids and orphans every learner's progress. A URL is not worth that, so
 *    the same correction is applied in place here.
 *
 * Idempotent: a URL already pointing at its replacement is left alone, so
 * running it twice changes nothing the second time.
 */
import path from "path";
import * as dotenv from "dotenv";
import mongoose from "mongoose";
import { Roadmap } from "../models/Roadmap";

/**
 * Curated URLs that moved, and where they moved to. Applied to every roadmap,
 * not only the curated ones: the course builder copies stages verbatim, so a
 * learner-built course can hold its own copy of a stale link.
 */
const CURATED_REPLACEMENTS = new Map<string, string>([
  // 404 — Read the Docs dropped the /en/stable/ alias.
  ["https://docs.gunicorn.org/en/stable/", "https://docs.gunicorn.org/"],
  // 404 — the tutorial moved under the user guide.
  [
    "https://scikit-learn.org/stable/tutorial/text_analytics/working_with_text_data.html",
    "https://scikit-learn.org/stable/modules/feature_extraction.html",
  ],
  // 403 for everyone, browser included — the course moved off offsec.com.
  ["https://www.offsec.com/metasploit-unleashed/", "https://docs.metasploit.com/"],
]);

/** Builds the search URL that replaces a fabricated link on the same host. */
function searchUrlFor(host: string, query: string): string | null {
  const q = encodeURIComponent(query);
  switch (host) {
    case "www.freecodecamp.org":
    case "freecodecamp.org":
      return `https://www.freecodecamp.org/news/search?query=${q}`;
    case "www.youtube.com":
    case "youtube.com":
    case "m.youtube.com":
    case "youtu.be":
      return `https://www.youtube.com/results?search_query=${q}`;
    case "www.geeksforgeeks.org":
    case "geeksforgeeks.org":
      return `https://www.geeksforgeeks.org/search/?gq=${q}`;
    default:
      return null;
  }
}

/** True when the URL is already a search page and so needs no rewrite. */
function isSearchUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.pathname.split("/").filter(Boolean).includes("search")) return true;
    if (u.pathname === "/results") return true;
    return ["q", "query", "search_query", "gq"].some((k) => u.searchParams.has(k));
  } catch {
    return false;
  }
}

/**
 * The subject to search for.
 *
 * Generated stage titles already end in the topic ("Core Technique Deep Dive:
 * Dynamic Programming"), so naively joining the two gives a query that names
 * it three times. Strip the repetition and the stage's "Section: Topic"
 * punctuation so the link lands on a search a human would have typed.
 */
export function searchSubject(topic: string, stageTitle: string): string {
  const topicLower = topic.trim().toLowerCase();
  let title = stageTitle.trim();

  // "Core Technique Deep Dive: Dynamic Programming" -> "Core Technique Deep Dive"
  const colon = title.lastIndexOf(":");
  if (colon > 0 && title.slice(colon + 1).trim().toLowerCase() === topicLower) {
    title = title.slice(0, colon).trim();
  }

  if (!title || title.toLowerCase() === topicLower) return topic.trim();
  if (title.toLowerCase().includes(topicLower)) return title;
  return `${topic.trim()} ${title}`;
}

function hostOf(raw: string): string | null {
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

interface Options {
  dryRun: boolean;
}

export function parseArgs(argv: string[]): Options {
  const opts: Options = { dryRun: false };
  for (const arg of argv) {
    if (arg === "--dry-run") opts.dryRun = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmind";

  await mongoose.connect(MONGO_URI);
  // Never log MONGO_URI — it carries credentials.
  console.log(`Connected to MongoDB${opts.dryRun ? "  (dry run — nothing will be written)" : ""}`);

  let curatedFixed = 0;
  let fabricatedFixed = 0;
  let flagged = 0;
  let docsTouched = 0;

  try {
    const roadmaps = await Roadmap.find({}).select("topic sourceModel stages").exec();
    console.log(`Scanning ${roadmaps.length} roadmaps\n`);

    for (const roadmap of roadmaps) {
      let changed = false;
      // Fabricated URLs only ever came from the generator. Curated stages hold
      // hand-checked deep links, including real youtube.com/watch?v= ones, and
      // rewriting those to a search page would be a downgrade, not a repair.
      const generated = roadmap.sourceModel !== "curated";

      for (const stage of roadmap.stages ?? []) {
        for (const resource of stage.freeResources ?? []) {
          const replacement = CURATED_REPLACEMENTS.get(resource.url);
          if (replacement) {
            console.log(`  curated  ${roadmap.topic} / ${stage.title}`);
            console.log(`           ${resource.url}\n        -> ${replacement}`);
            resource.url = replacement;
            resource.lastVerifiedAt = new Date();
            curatedFixed++;
            changed = true;
            continue;
          }

          if (!generated) continue;

          const host = hostOf(resource.url);
          if (!host) continue;

          if (!isSearchUrl(resource.url)) {
            // Subject, not the resource's own title: that title is itself
            // mock output ("... — freeCodeCamp Handbook") and searching for it
            // would return nothing useful.
            const next = searchUrlFor(host, searchSubject(roadmap.topic, stage.title));
            if (next && next !== resource.url) {
              console.log(`  fabricated  ${roadmap.topic} / ${stage.title}`);
              console.log(`           ${resource.url}\n        -> ${next}`);
              resource.url = next;
              resource.type = "doc";
              fabricatedFixed++;
              changed = true;
            }
          }

          // Whatever it points at now, a generated search URL is a fallback,
          // and `verified` is the field that has always said so.
          if (isSearchUrl(resource.url) && resource.verified !== false) {
            resource.verified = false;
            resource.lastVerifiedAt = new Date();
            flagged++;
            changed = true;
          }
        }
      }

      if (changed) {
        docsTouched++;
        if (!opts.dryRun) await roadmap.save();
      }
    }

    console.log(
      `\ncurated links corrected ${curatedFixed}, ` +
        `fabricated links rewritten ${fabricatedFixed}, ` +
        `flagged as fallback ${flagged}, ` +
        `roadmaps ${opts.dryRun ? "that would be written" : "written"} ${docsTouched}`
    );
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      console.error(`\n${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    });
}
