import type { Roadmap, Stage } from "@/types/roadmap";

// Dummy data used to build/preview the 3D path before real API wiring, and
// as a design-time fallback. Shape-identical to a mapped API roadmap.
const TEMPLATE: Array<Pick<Stage, "title" | "type" | "difficulty" | "estimatedDays">> = [
  { title: "Fundamentals & Core Concepts", type: "learn", difficulty: "beginner", estimatedDays: 3 },
  { title: "Core Technique Deep Dive", type: "learn", difficulty: "beginner", estimatedDays: 4 },
  { title: "Guided Practice — Easy Problems", type: "practice", difficulty: "beginner", estimatedDays: 3 },
  { title: "Applied Patterns & Intermediate Theory", type: "learn", difficulty: "intermediate", estimatedDays: 5 },
  { title: "Practice Arena — Medium Problems", type: "practice", difficulty: "intermediate", estimatedDays: 4 },
  { title: "Advanced Topics & System-Level Thinking", type: "learn", difficulty: "advanced", estimatedDays: 5 },
  { title: "Contest-Level & Advanced Practice", type: "practice", difficulty: "advanced", estimatedDays: 4 },
];

function stagePosition(order: number, total: number): [number, number, number] {
  const angle = (order / Math.max(total, 1)) * Math.PI * 2.2;
  const x = Math.sin(angle) * 6;
  const y = Math.cos(angle * 0.6) * 2;
  const z = -order * 8;
  return [x, y, z];
}

export function buildDummyRoadmap(topic: string): Roadmap {
  const stages: Stage[] = TEMPLATE.map((t, i) => ({
    id: `dummy-stage-${i}`,
    order: i,
    title: `${t.title}: ${topic}`,
    type: t.type,
    difficulty: t.difficulty,
    syllabus: [`Intro to ${topic}`, `Key concept ${i + 1}`, `Worked example`],
    resources: [
      {
        title: `${topic} — free playlist`,
        url: "https://www.youtube.com/",
        type: "playlist",
        lastVerifiedAt: new Date().toISOString(),
        verified: true,
      },
    ],
    certifications: [
      {
        title: `${topic} Professional Certificate`,
        provider: "coursera",
        url: "https://www.coursera.org/",
        price: 49,
        rank: 1,
        lastVerifiedAt: new Date().toISOString(),
      },
    ],
    practiceLinks:
      t.type === "practice"
        ? [
            {
              platform: "leetcode",
              problemId: "1",
              title: "Two Sum",
              url: "https://leetcode.com/problems/two-sum/",
              difficulty: t.difficulty,
              verified: true,
            },
          ]
        : [],
    estimatedDays: t.estimatedDays,
    prerequisiteStageId: i === 0 ? null : `dummy-stage-${i - 1}`,
    position: stagePosition(i, TEMPLATE.length),
  }));

  return {
    id: "dummy-roadmap",
    topic,
    slug: "dummy-roadmap",
    createdAt: new Date().toISOString(),
    stages,
    suggestedTimeline: stages.map((s, i) => ({ day: i + 1, tasks: [`1hr: ${s.title}`] })),
  };
}
