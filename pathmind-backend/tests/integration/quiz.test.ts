import request from "supertest";
import { Types } from "mongoose";
import { createApp } from "@/app";
import { Roadmap, type RoadmapDocument } from "@/models/Roadmap";
import { UserProgress } from "@/models/UserProgress";
import { buildQuiz, PASS_MARK, QUESTION_COUNT } from "@/services/quiz/quiz.service";
import { clearCollections, startInMemoryMongo, stopInMemoryMongo } from "../mocks/mongoMemory";

const app = createApp();

beforeAll(async () => {
  await startInMemoryMongo();
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await stopInMemoryMongo();
});

const PASSWORD = "hunter2hunter2";

let seq = 0;

async function register(): Promise<{ cookies: string[]; id: string }> {
  seq += 1;
  const res = await request(app)
    .post("/auth/register")
    .send({ email: `q${Date.now()}${seq}@example.com`, password: PASSWORD });
  expect(res.status).toBe(201);
  return {
    cookies: res.headers["set-cookie"] as unknown as string[],
    id: res.body.user.id as string,
  };
}

/**
 * Seeds a course with hand-written stages rather than generating one.
 *
 * The quiz is derived from the syllabus, so the test needs syllabus items that
 * are distinct across stages — a generated roadmap repeats the same wording in
 * several stages, which makes "which stage covers this" genuinely ambiguous
 * and the derived answers harder to reason about.
 *
 * Stage ids are minted here so each stage can point its `prerequisiteStageId`
 * at the one before it; that chain is what the unlock rule walks, and without
 * it only the first stage would ever be completable.
 */
async function seedCourse(stages: Array<{ title: string; syllabus: string[] }>) {
  seq += 1;
  const ids = stages.map(() => new Types.ObjectId());
  return Roadmap.create({
    topic: `Quiz Course ${seq}`,
    normalizedTopic: `quiz course ${seq}`,
    slug: `quiz-course-${seq}-${Date.now()}`,
    category: "Web Development",
    summary: "A course used by the quiz tests.",
    isPublicTemplate: true,
    sourceModel: "curated",
    stages: stages.map((s, i) => ({
      _id: ids[i],
      order: i,
      title: s.title,
      type: "learn" as const,
      difficulty: "beginner" as const,
      prerequisiteStageId: i === 0 ? null : ids[i - 1],
      syllabus: s.syllabus,
      freeResources: [
        { title: `${s.title} docs`, url: "https://example.com", type: "doc", verified: true },
      ],
      certifications: [],
      practiceLinks: [],
      estimatedDays: 2,
    })),
    suggestedTimeline: [{ day: 1, tasks: ["start"] }],
  });
}

/** Four stages, sixteen distinct items — comfortably past `canQuiz`. */
function fullCourseStages() {
  return [
    { title: "Foundations", syllabus: ["Values and types", "Operators", "Control flow", "Functions"] },
    { title: "Structuring Code", syllabus: ["Modules", "Packages", "Namespacing", "Imports"] },
    { title: "Working with Data", syllabus: ["Arrays", "Maps", "Iterators", "Serialisation"] },
    { title: "Shipping It", syllabus: ["Bundling", "Linting", "Release tags", "Changelogs"] },
  ];
}

/** Walks the real progress route stage by stage, in unlock order. */
async function completeEveryStage(cookies: string[], roadmap: RoadmapDocument): Promise<void> {
  const ordered = [...roadmap.stages].sort((a, b) => a.order - b.order);
  for (const stage of ordered) {
    const res = await request(app)
      .patch(`/roadmaps/${roadmap._id.toString()}/progress/${stage._id.toString()}`)
      .set("Cookie", cookies);
    expect(res.status).toBe(200);
  }
}

/**
 * Re-derives the answer key the server kept to itself.
 *
 * This is the whole point of the seed: the client never sees an answer, but
 * anyone holding the roadmap and the seed can rebuild the identical quiz. The
 * test stands in for the server's own scoring pass.
 */
async function answersFor(
  roadmapId: string,
  seed: string,
  wrong = 0
): Promise<Array<{ id: string; answerIndex: number }>> {
  const roadmap = await Roadmap.findById(roadmapId);
  const questions = buildQuiz(roadmap!.stages, seed);
  return questions.map((q, i) => ({
    id: q.id,
    answerIndex: i < wrong ? (q.answerIndex + 1) % q.options.length : q.answerIndex,
  }));
}

async function setupFinishedCourse() {
  const learner = await register();
  const roadmap = await seedCourse(fullCourseStages());
  await completeEveryStage(learner.cookies, roadmap);
  return { learner, roadmap, roadmapId: roadmap._id.toString() };
}

describe("quiz authentication", () => {
  it("refuses both quiz endpoints to an anonymous caller", async () => {
    const roadmap = await seedCourse(fullCourseStages());
    const id = roadmap._id.toString();

    await request(app).get(`/roadmaps/${id}/quiz`).expect(401);
    await request(app)
      .post(`/roadmaps/${id}/quiz`)
      .send({ seed: "a".repeat(24), answers: [] })
      .expect(401);
  });
});

describe("GET /roadmaps/:id/quiz", () => {
  it("refuses while any stage is still incomplete", async () => {
    const learner = await register();
    const roadmap = await seedCourse(fullCourseStages());
    const id = roadmap._id.toString();

    const untouched = await request(app).get(`/roadmaps/${id}/quiz`).set("Cookie", learner.cookies);
    expect(untouched.status).toBe(400);
    expect(untouched.body.message ?? untouched.body.error).toMatch(/Finish every stage first/);

    // Still refused one stage short of the end — not only from a standing start.
    const ordered = [...roadmap.stages].sort((a, b) => a.order - b.order);
    for (const stage of ordered.slice(0, -1)) {
      await request(app)
        .patch(`/roadmaps/${id}/progress/${stage._id.toString()}`)
        .set("Cookie", learner.cookies)
        .expect(200);
    }

    const almost = await request(app).get(`/roadmaps/${id}/quiz`).set("Cookie", learner.cookies);
    expect(almost.status).toBe(400);
    expect(almost.body.message ?? almost.body.error).toMatch(
      new RegExp(`${ordered.length - 1} of ${ordered.length}`)
    );
  });

  it("returns ten questions and leaks no answer", async () => {
    const { learner, roadmapId } = await setupFinishedCourse();

    const res = await request(app).get(`/roadmaps/${roadmapId}/quiz`).set("Cookie", learner.cookies);
    expect(res.status).toBe(200);
    expect(res.body.questions).toHaveLength(QUESTION_COUNT);
    expect(res.body.total).toBe(QUESTION_COUNT);
    expect(res.body.passMark).toBe(PASS_MARK);
    expect(res.body.alreadyPassed).toBe(false);
    expect(res.body.seed).toMatch(/^[0-9a-f]{24}$/);

    // The payload as it goes over the wire — not the parsed object, so a
    // nested or renamed answer field cannot slip past.
    const serialised = JSON.stringify(res.body);
    expect(serialised).not.toMatch(/answerIndex/);
    expect(serialised).not.toMatch(/\banswer\b/);

    for (const question of res.body.questions) {
      expect(Object.keys(question).sort()).toEqual(["id", "options", "prompt"]);
      expect(typeof question.prompt).toBe("string");
      expect(question.options.length).toBeGreaterThanOrEqual(2);
    }

    // Two fetches are two independent attempts, so the seeds differ.
    const second = await request(app)
      .get(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies);
    expect(second.body.seed).not.toBe(res.body.seed);
  });

  it("refuses a roadmap too short to build a quiz from", async () => {
    const learner = await register();
    const roadmap = await seedCourse([
      { title: "One", syllabus: ["a", "b"] },
      { title: "Two", syllabus: ["c", "d"] },
      { title: "Three", syllabus: ["e", "f"] },
    ]);
    await completeEveryStage(learner.cookies, roadmap);

    const res = await request(app)
      .get(`/roadmaps/${roadmap._id.toString()}/quiz`)
      .set("Cookie", learner.cookies);
    expect(res.status).toBe(400);
    expect(res.body.message ?? res.body.error).toMatch(/too short/i);
  });
});

describe("POST /roadmaps/:id/quiz", () => {
  it("passes a correct submission, records it, and unlocks the certificate", async () => {
    const { learner, roadmapId } = await setupFinishedCourse();

    // The certificate is barred until the quiz is passed, even though every
    // stage is already complete.
    const barred = await request(app)
      .post(`/roadmaps/${roadmapId}/certificate`)
      .set("Cookie", learner.cookies);
    expect(barred.status).toBe(400);
    expect(barred.body.message ?? barred.body.error).toMatch(/Pass the certificate quiz first/);

    const quiz = await request(app)
      .get(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies);
    const seed = quiz.body.seed as string;

    const submitted = await request(app)
      .post(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies)
      .send({ seed, answers: await answersFor(roadmapId, seed) });

    expect(submitted.status).toBe(200);
    expect(submitted.body.correct).toBe(QUESTION_COUNT);
    expect(submitted.body.total).toBe(QUESTION_COUNT);
    expect(submitted.body.passed).toBe(true);
    expect(submitted.body.passMark).toBe(PASS_MARK);
    expect(submitted.body.attempts).toBe(1);
    expect(submitted.body.review).toHaveLength(QUESTION_COUNT);
    expect(submitted.body.review.every((r: { correct: boolean }) => r.correct)).toBe(true);

    const progress = await UserProgress.findOne({ userId: learner.id, roadmapId }).lean();
    expect(progress!.quizPassedAt).toBeTruthy();
    expect(progress!.quizScore).toBe(QUESTION_COUNT);

    // And the gate is now open.
    const issued = await request(app)
      .post(`/roadmaps/${roadmapId}/certificate`)
      .set("Cookie", learner.cookies);
    expect(issued.status).toBe(201);
    expect(issued.body.certificate.serial).toMatch(/^VID-\d{4}-[0-9A-F]{8}$/);

    // A later fetch says so, so the UI need not guess.
    const again = await request(app)
      .get(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies);
    expect(again.body.alreadyPassed).toBe(true);
  });

  it("fails a submission one mark short and keeps the certificate shut", async () => {
    const { learner, roadmapId } = await setupFinishedCourse();

    const quiz = await request(app)
      .get(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies);
    const seed = quiz.body.seed as string;

    // Seven of ten: above half, below the pass mark of eight.
    const submitted = await request(app)
      .post(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies)
      .send({ seed, answers: await answersFor(roadmapId, seed, QUESTION_COUNT - 7) });

    expect(submitted.status).toBe(200);
    expect(submitted.body.correct).toBe(7);
    expect(submitted.body.passed).toBe(false);
    expect(submitted.body.review.filter((r: { correct: boolean }) => r.correct)).toHaveLength(7);

    const progress = await UserProgress.findOne({ userId: learner.id, roadmapId }).lean();
    expect(progress!.quizPassedAt).toBeFalsy();
    expect(progress!.quizScore).toBeFalsy();

    const refused = await request(app)
      .post(`/roadmaps/${roadmapId}/certificate`)
      .set("Cookie", learner.cookies);
    expect(refused.status).toBe(400);
    expect(refused.body.message ?? refused.body.error).toMatch(/Pass the certificate quiz first/);
  });

  /**
   * The seed is the whole scoring contract. Answers keyed to a different quiz
   * must not score — otherwise a learner could fetch attempt after attempt,
   * keep the easiest answer key, and submit it against anything.
   */
  it("does not pass answers that belong to a different seed", async () => {
    const { learner, roadmapId } = await setupFinishedCourse();

    const submittedSeed = "a1b2c3d4e5f60718293a4b5c";
    const otherSeed = "0f1e2d3c4b5a69788796a5b4";

    const res = await request(app)
      .post(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies)
      .send({ seed: submittedSeed, answers: await answersFor(roadmapId, otherSeed) });

    expect(res.status).toBe(200);
    expect(res.body.passed).toBe(false);
    expect(res.body.correct).toBeLessThan(PASS_MARK);

    const progress = await UserProgress.findOne({ userId: learner.id, roadmapId }).lean();
    expect(progress!.quizPassedAt).toBeFalsy();

    // The right answers for that seed still work, so the quiz itself is sound.
    const honest = await request(app)
      .post(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies)
      .send({ seed: submittedSeed, answers: await answersFor(roadmapId, submittedSeed) });
    expect(honest.body.passed).toBe(true);
  });

  it("counts every attempt and survives a second pass", async () => {
    const { learner, roadmapId } = await setupFinishedCourse();

    const first = await request(app)
      .get(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies);
    const failed = await request(app)
      .post(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies)
      .send({ seed: first.body.seed, answers: await answersFor(roadmapId, first.body.seed, 5) });
    expect(failed.body.passed).toBe(false);
    expect(failed.body.attempts).toBe(1);

    const second = await request(app)
      .get(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies);
    const passed = await request(app)
      .post(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies)
      .send({ seed: second.body.seed, answers: await answersFor(roadmapId, second.body.seed) });
    expect(passed.body.passed).toBe(true);
    expect(passed.body.attempts).toBe(2);

    const issued = await request(app)
      .post(`/roadmaps/${roadmapId}/certificate`)
      .set("Cookie", learner.cookies);
    expect(issued.status).toBe(201);

    const afterFirstPass = await UserProgress.findOne({ userId: learner.id, roadmapId }).lean();

    // Re-taking an already-passed quiz is allowed and changes nothing that
    // matters: still passed, attempt counted, certificate untouched.
    const third = await request(app)
      .get(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies);
    expect(third.body.alreadyPassed).toBe(true);
    const retaken = await request(app)
      .post(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies)
      .send({ seed: third.body.seed, answers: await answersFor(roadmapId, third.body.seed) });
    expect(retaken.status).toBe(200);
    expect(retaken.body.passed).toBe(true);
    expect(retaken.body.attempts).toBe(3);

    const afterRetake = await UserProgress.findOne({ userId: learner.id, roadmapId }).lean();
    expect(afterRetake!.quizAttempts).toBe(3);
    expect(afterRetake!.quizPassedAt).toBeTruthy();
    expect(afterRetake!.quizScore).toBe(QUESTION_COUNT);

    // NOTE: `submitQuiz` uses `$set` on every pass, so `quizPassedAt` moves to
    // the latest pass — its own comment says the first pass should be kept.
    // Asserted as-is rather than as-intended; see the report accompanying this
    // file. The certificate's issue date is unaffected, because the
    // certificate is written once and never re-issued.
    expect(
      new Date(afterRetake!.quizPassedAt!).getTime()
    ).toBeGreaterThanOrEqual(new Date(afterFirstPass!.quizPassedAt!).getTime());

    const reissued = await request(app)
      .post(`/roadmaps/${roadmapId}/certificate`)
      .set("Cookie", learner.cookies);
    expect(reissued.status).toBe(200);
    expect(reissued.body.certificate.serial).toBe(issued.body.certificate.serial);
    expect(reissued.body.certificate.issuedAt).toBe(issued.body.certificate.issuedAt);
  });

  it("refuses to score an attempt on a roadmap too short to quiz", async () => {
    const learner = await register();
    const roadmap = await seedCourse([
      { title: "One", syllabus: ["a", "b"] },
      { title: "Two", syllabus: ["c", "d"] },
      { title: "Three", syllabus: ["e", "f"] },
    ]);

    const res = await request(app)
      .post(`/roadmaps/${roadmap._id.toString()}/quiz`)
      .set("Cookie", learner.cookies)
      .send({ seed: "a".repeat(24), answers: [] });
    expect(res.status).toBe(400);
    expect(res.body.message ?? res.body.error).toMatch(/too short/i);
  });
});

describe("the certificate gate", () => {
  /**
   * A roadmap with too little material cannot produce ten questions, so there
   * is no quiz to pass. Gating it would make its certificate unreachable
   * forever — the exemption is what keeps the gate from becoming a wall.
   */
  it("exempts a roadmap that cannot be quizzed, once every stage is done", async () => {
    const learner = await register();
    const roadmap = await seedCourse([
      { title: "One", syllabus: ["a", "b"] },
      { title: "Two", syllabus: ["c", "d"] },
      { title: "Three", syllabus: ["e", "f"] },
    ]);
    const id = roadmap._id.toString();

    // Unfinished, it is still refused — for the ordinary reason.
    const early = await request(app).post(`/roadmaps/${id}/certificate`).set("Cookie", learner.cookies);
    expect(early.status).toBe(400);
    expect(early.body.message ?? early.body.error).toMatch(/Finish every stage first/);

    await completeEveryStage(learner.cookies, roadmap);

    const issued = await request(app)
      .post(`/roadmaps/${id}/certificate`)
      .set("Cookie", learner.cookies);
    expect(issued.status).toBe(201);
    expect(issued.body.certificate.stagesCompleted).toBe(roadmap.stages.length);

    const progress = await UserProgress.findOne({ userId: learner.id, roadmapId: id }).lean();
    expect(progress!.quizPassedAt).toBeFalsy();
  });

  it("does not let one learner's pass certify another", async () => {
    const { learner, roadmapId } = await setupFinishedCourse();

    const quiz = await request(app)
      .get(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies);
    await request(app)
      .post(`/roadmaps/${roadmapId}/quiz`)
      .set("Cookie", learner.cookies)
      .send({ seed: quiz.body.seed, answers: await answersFor(roadmapId, quiz.body.seed) })
      .expect(200);
    await request(app)
      .post(`/roadmaps/${roadmapId}/certificate`)
      .set("Cookie", learner.cookies)
      .expect(201);

    // A second learner finishes the same shared roadmap — the pass is on the
    // first learner's progress record, not on the roadmap, so it does not
    // travel.
    const other = await register();
    const roadmap = await Roadmap.findById(roadmapId);
    await completeEveryStage(other.cookies, roadmap!);

    const res = await request(app)
      .post(`/roadmaps/${roadmapId}/certificate`)
      .set("Cookie", other.cookies);
    expect(res.status).toBe(400);
    expect(res.body.message ?? res.body.error).toMatch(/Pass the certificate quiz first/);
  });
});
