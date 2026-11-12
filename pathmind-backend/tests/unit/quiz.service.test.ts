import { Types } from "mongoose";
import {
  buildQuiz,
  canQuiz,
  newSeed,
  publicQuestions,
  scoreQuiz,
  PASS_MARK,
  QUESTION_COUNT,
} from "@/services/quiz/quiz.service";
import type { Stage } from "@/models/Roadmap";

function stage(title: string, syllabus: string[], order: number): Stage {
  return {
    _id: new Types.ObjectId(),
    order,
    title,
    type: "learn",
    difficulty: "beginner",
    prerequisiteStageId: null,
    syllabus,
    freeResources: [],
    certifications: [],
    practiceLinks: [],
    estimatedDays: 2,
  } as unknown as Stage;
}

const STAGES: Stage[] = [
  stage("Kotlin and Android Basics", ["Variables and types", "Activities", "Intents", "Gradle"], 0),
  stage("Building UI with Compose", ["Composables", "State hoisting", "Modifiers", "Theming"], 1),
  stage("Async and Data Layer", ["Coroutines", "Flow", "Room", "Retrofit"], 2),
  stage("Shipping to Play Store", ["Signing", "Play Console", "Crash reporting", "Staged rollout"], 3),
];

describe("canQuiz", () => {
  it("accepts a normal course", () => {
    expect(canQuiz(STAGES)).toBe(true);
  });

  it("rejects a course with too few stages to build options from", () => {
    expect(canQuiz(STAGES.slice(0, 2))).toBe(false);
  });

  it("rejects a course with fewer syllabus items than questions", () => {
    const thin = [stage("A", ["x"], 0), stage("B", ["y"], 1), stage("C", ["z"], 2)];
    expect(canQuiz(thin)).toBe(false);
  });
});

describe("buildQuiz", () => {
  it(`returns exactly ${QUESTION_COUNT} questions`, () => {
    expect(buildQuiz(STAGES, "seed-a")).toHaveLength(QUESTION_COUNT);
  });

  it("is deterministic in the seed", () => {
    const a = buildQuiz(STAGES, "same-seed");
    const b = buildQuiz(STAGES, "same-seed");
    expect(b).toEqual(a);
  });

  it("produces a different paper for a different seed", () => {
    const a = buildQuiz(STAGES, "seed-one").map((q) => q.prompt);
    const b = buildQuiz(STAGES, "seed-two").map((q) => q.prompt);
    expect(a).not.toEqual(b);
  });

  it("never repeats a prompt within one quiz", () => {
    const prompts = buildQuiz(STAGES, "dupe-check").map((q) => q.prompt);
    expect(new Set(prompts).size).toBe(prompts.length);
  });

  it("always includes the correct answer among the options", () => {
    for (const q of buildQuiz(STAGES, "answer-present")) {
      expect(q.options[q.answerIndex]).toBeDefined();
      expect(q.options).toHaveLength(new Set(q.options).size); // no duplicate options
    }
  });
});

describe("publicQuestions", () => {
  it("does not leak the answer to the client", () => {
    const sent = publicQuestions(buildQuiz(STAGES, "no-leak"));
    for (const q of sent) {
      expect(Object.keys(q).sort()).toEqual(["id", "options", "prompt"]);
      expect((q as unknown as Record<string, unknown>).answerIndex).toBeUndefined();
    }
    expect(JSON.stringify(sent)).not.toContain("answerIndex");
  });
});

describe("scoreQuiz", () => {
  const seed = "score-seed";
  const paper = buildQuiz(STAGES, seed);
  const allCorrect = paper.map((q) => ({ id: q.id, answerIndex: q.answerIndex }));

  it("scores a perfect paper", () => {
    const r = scoreQuiz(STAGES, seed, allCorrect);
    expect(r.correct).toBe(QUESTION_COUNT);
    expect(r.passed).toBe(true);
  });

  it(`passes at exactly ${PASS_MARK} correct`, () => {
    const answers = allCorrect.map((a, i) =>
      i < PASS_MARK ? a : { id: a.id, answerIndex: (a.answerIndex + 1) % 4 }
    );
    const r = scoreQuiz(STAGES, seed, answers);
    expect(r.correct).toBe(PASS_MARK);
    expect(r.passed).toBe(true);
  });

  it(`fails one short of ${PASS_MARK}`, () => {
    const answers = allCorrect.map((a, i) =>
      i < PASS_MARK - 1 ? a : { id: a.id, answerIndex: (a.answerIndex + 1) % 4 }
    );
    const r = scoreQuiz(STAGES, seed, answers);
    expect(r.correct).toBe(PASS_MARK - 1);
    expect(r.passed).toBe(false);
  });

  it("counts a missing answer as wrong rather than throwing", () => {
    const r = scoreQuiz(STAGES, seed, []);
    expect(r.correct).toBe(0);
    expect(r.passed).toBe(false);
    expect(r.review).toHaveLength(QUESTION_COUNT);
  });

  it("counts an out-of-range answer as wrong", () => {
    const r = scoreQuiz(STAGES, seed, allCorrect.map((a) => ({ ...a, answerIndex: 99 })));
    expect(r.correct).toBe(0);
    expect(r.passed).toBe(false);
  });

  it("cannot be passed with answers for a different seed", () => {
    const other = buildQuiz(STAGES, "a-different-seed");
    const r = scoreQuiz(
      STAGES,
      seed,
      other.map((q) => ({ id: q.id, answerIndex: q.answerIndex }))
    );
    expect(r.passed).toBe(false);
  });

  it("returns the right answer in the review so a learner can see what they missed", () => {
    const r = scoreQuiz(STAGES, seed, []);
    for (const item of r.review) {
      expect(item.answer).not.toBe("");
      expect(item.correct).toBe(false);
    }
  });
});

describe("newSeed", () => {
  it("is 24 hex characters and does not repeat", () => {
    const seeds = new Set(Array.from({ length: 50 }, () => newSeed()));
    expect(seeds.size).toBe(50);
    for (const s of seeds) expect(s).toMatch(/^[0-9a-f]{24}$/);
  });
});
