# Curated course catalog

Every `*.json` file in this directory is a **JSON array of course objects**. They are
loaded, validated and turned into public-template `Roadmap` documents by
`src/utils/seedCourses.ts` (`npm run seed:courses`).

Files are grouped however you like (e.g. `languages.json`, `web.json`, `data.json`) —
the loader reads them all and does not care about the file names. `README.md` is
ignored.

## Contract

```jsonc
[
  {
    "topic": "Python Programming",          // required, unique across ALL files (case/space-insensitive)
    "category": "Languages & CS",           // required — stored on the Roadmap; see "Category" below
    "summary": "One sentence.",             // required — stored on the Roadmap; shown on the catalog card
    "stages": [                             // 4-5 stages, ordered beginner -> advanced
      {
        "title": "Syntax and Core Types",
        "type": "learn",                    // "learn" | "practice"
        "difficulty": "beginner",           // "beginner" | "intermediate" | "advanced"
        "estimatedDays": 3,                 // positive integer
        "syllabus": ["...", "..."],         // 4-6 short strings
        "resources": [                      // 2-3 entries
          {
            "title": "The Python Tutorial",
            "url": "https://docs.python.org/3/tutorial/",  // must be https://
            "type": "doc"                   // "doc" | "blog" (the model also allows "video" | "playlist")
          }
        ],
        "practiceTags": ["strings", "arrays"]  // optional; only meaningful on "practice" stages
      }
    ]
  }
]
```

## Rules the loader enforces (`src/schemas/course.schema.ts`)

- Every listed field above is required unless marked optional.
- Enums are exact: `type`, `difficulty`, `resources[].type`.
- `stages` must have at least one entry; `syllabus` and `resources` at least one entry each.
- `estimatedDays` must be a positive integer.
- `resources[].url` must be a valid `https://` URL (plain `http://` is rejected).
- `topic` must be unique across every file. Duplicates fail the whole run and the
  loader names both files.
- Unknown extra keys are ignored, so adding a field here is never a breaking change.

## What the loader derives (don't put these in the JSON)

- `slug` (from `topic`, de-duplicated against the DB), `normalizedTopic`
- per-stage `_id`, `order` (0-based, from array index) and the `prerequisiteStageId`
  chain (`null` on the first stage, previous stage's `_id` afterwards)
- `freeResources[].lastVerifiedAt` / `verified`
- `practiceLinks` — resolved from `practiceTags` + the stage `difficulty` through
  `src/services/practiceLinks/practiceLinks.service.ts`. A tag with no curated match
  falls back to a platform tag-browse link, so prefer tags that already appear in
  `practiceLinks.seed.json`.
- `certifications` — always `[]` for curated courses
- `suggestedTimeline` — one `{ day, tasks }` entry per day; each stage's `syllabus`
  is spread across that stage's `estimatedDays`, days numbered sequentially across
  the whole roadmap
- `isPublicTemplate: true`, `sourceModel: "curated"`

## Checking your file before committing

```bash
npm run seed:courses -- --dry-run      # validates + maps everything, writes nothing, needs no DB
```


## Category is what puts a course in the catalog

`category` and `summary` are written onto the `Roadmap` document, and
`GET /courses` matches on **published AND categorised** (`CATALOG_FILTER` in
`src/services/catalog.service.ts`).

That matters because every AI-generated roadmap is *also*
`isPublicTemplate: true` — that is how the generation cache is shared between
learners. A catalog defined as "public templates" would therefore fill with
whatever anyone had ever typed into the topic box, uncategorised, burying these
curated courses. Setting a category is the editorial act that publishes a
course; an admin can also set one on a generated roadmap to promote it.

Use one of the existing categories unless you are genuinely adding a subject —
they are the catalog's filter chips, and a one-off spelling creates a chip with
a single course behind it.

## Re-seeding a course that is already live

`npm run seed:courses` is safe to re-run. For a course that already exists it
updates **only** `category` and `summary` and reports `metadata`; it does not
touch the stages, so nobody's progress moves.

`--force` replaces the whole document. That regenerates every stage `_id`, and
stage ids are the keys `UserProgress` stores completions against — so forcing a
course that learners are partway through **discards their progress on it**. Use
it for a course nobody has started, or accept that cost deliberately.
