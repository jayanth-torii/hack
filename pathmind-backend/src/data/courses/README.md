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
    "category": "Languages & CS",           // required, free text — NOT stored on the Roadmap model
    "summary": "One sentence.",             // required — NOT stored on the Roadmap model
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
