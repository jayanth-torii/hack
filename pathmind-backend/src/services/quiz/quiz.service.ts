import { createHash, randomBytes } from "crypto";
import type { Stage } from "../../models/Roadmap";

/**
 * The certificate quiz.
 *
 * Questions are **derived from the roadmap itself** rather than authored, so
 * every roadmap can be gated — including the AI-generated ones, which have no
 * hand-written question bank and never will. The trade is explicit: this tests
 * whether a learner actually worked through the course they are claiming,
 * not whether they know the subject in the abstract.
 *
 * Two properties matter more than the questions:
 *
 *  1. **Answers never leave the server.** The client receives prompts and
 *     options only; scoring regenerates the quiz and compares server-side.
 *  2. **Generation is deterministic in the seed.** A quiz is reproducible from
 *     `(roadmapId, seed)`, so nothing has to be stored between fetching a quiz
 *     and submitting it, and a learner cannot have their questions swapped out
 *     underneath them by a concurrent request.
 */

export const QUESTION_COUNT = 10;
/** Correct answers needed to earn the certificate. */
export const PASS_MARK = 8;
/** Below this many stages a roadmap cannot produce enough distinct options. */
export const MIN_STAGES = 3;

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
}

interface InternalQuestion extends QuizQuestion {
  answerIndex: number;
}

export interface QuizResult {
  correct: number;
  total: number;
  passed: boolean;
  /** Per-question outcome, so the learner can see what they missed. */
  review: Array<{ id: string; prompt: string; correct: boolean; answer: string }>;
}

/** Fresh, unguessable seed for one attempt. */
export function newSeed(): string {
  return randomBytes(12).toString("hex");
}

/**
 * Deterministic PRNG. `Math.random` would make the quiz irreproducible, which
 * would mean storing every generated quiz just to score it later.
 */
function rngFrom(seed: string): () => number {
  const h = createHash("sha256").update(seed).digest();
  let a = h.readUInt32LE(0) || 1;
  let b = h.readUInt32LE(4) || 2;
  let c = h.readUInt32LE(8) || 3;
  let d = h.readUInt32LE(12) || 4;
  return () => {
    // xoshiro128**
    const t = (b << 9) >>> 0;
    let r = (Math.imul(b, 5) >>> 0);
    r = (((r << 7) | (r >>> 25)) >>> 0);
    r = (Math.imul(r, 9) >>> 0);
    c = (c ^ a) >>> 0;
    d = (d ^ b) >>> 0;
    b = (b ^ c) >>> 0;
    a = (a ^ d) >>> 0;
    c = (c ^ t) >>> 0;
    d = (((d << 11) | (d >>> 21)) >>> 0);
    return r / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Picks `n` distinct items, or everything when there are fewer than `n`. */
function sample<T>(items: readonly T[], n: number, rand: () => number): T[] {
  return shuffled(items, rand).slice(0, n);
}

function optionsFrom(
  correct: string,
  distractorPool: readonly string[],
  rand: () => number
): { options: string[]; answerIndex: number } {
  const pool = distractorPool.filter((d) => d !== correct);
  const distractors = sample(pool, 3, rand);
  const options = shuffled([correct, ...distractors], rand);
  return { options, answerIndex: options.indexOf(correct) };
}

interface SyllabusEntry {
  item: string;
  stageTitle: string;
}

/**
 * Builds the full question set for a roadmap.
 *
 * Two question shapes, both answerable only by someone who has seen the
 * course: "which stage covers this topic" and "which topic belongs to this
 * stage". Ordering questions fill in when a roadmap is small.
 */
function buildAll(stages: Stage[], rand: () => number): InternalQuestion[] {
  const stageTitles = stages.map((s) => s.title);
  const entries: SyllabusEntry[] = [];
  for (const stage of stages) {
    for (const item of stage.syllabus ?? []) {
      entries.push({ item, stageTitle: stage.title });
    }
  }
  const allItems = entries.map((e) => e.item);
  const questions: InternalQuestion[] = [];

  // Shape 1 — which stage covers this syllabus item?
  for (const entry of shuffled(entries, rand)) {
    const { options, answerIndex } = optionsFrom(entry.stageTitle, stageTitles, rand);
    if (options.length < 2) continue;
    questions.push({
      id: `s:${hash(entry.item)}`,
      prompt: `Which stage of this course covers “${entry.item}”?`,
      options,
      answerIndex,
    });
  }

  // Shape 2 — which of these topics belongs to this stage?
  for (const stage of shuffled(stages, rand)) {
    const own = stage.syllabus ?? [];
    if (own.length === 0) continue;
    const correct = own[Math.floor(rand() * own.length)]!;
    const foreign = allItems.filter((i) => !own.includes(i));
    if (foreign.length < 3) continue;
    const { options, answerIndex } = optionsFrom(correct, foreign, rand);
    questions.push({
      id: `t:${hash(stage.title)}`,
      prompt: `Which of these is part of “${stage.title}”?`,
      options,
      answerIndex,
    });
  }

  // Shape 3 — ordering. Only meaningful beyond the first stage.
  for (let i = 1; i < stages.length; i++) {
    const correct = stages[i - 1]!.title;
    const { options, answerIndex } = optionsFrom(correct, stageTitles, rand);
    questions.push({
      id: `o:${hash(stages[i]!.title)}`,
      prompt: `Which stage comes immediately before “${stages[i]!.title}”?`,
      options,
      answerIndex,
    });
  }

  return questions;
}

function hash(value: string): string {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

/** True when the roadmap can produce a meaningful quiz at all. */
export function canQuiz(stages: Stage[]): boolean {
  if (stages.length < MIN_STAGES) return false;
  const items = stages.reduce((n, s) => n + (s.syllabus?.length ?? 0), 0);
  return items >= QUESTION_COUNT;
}

/**
 * The quiz for one attempt. Same seed and same roadmap always yield the same
 * questions in the same order with the same options.
 */
export function buildQuiz(stages: Stage[], seed: string): InternalQuestion[] {
  const rand = rngFrom(seed);
  const all = buildAll(stages, rand);

  // De-duplicate by prompt so a short course cannot ask the same thing twice.
  const seen = new Set<string>();
  const unique = all.filter((q) => {
    if (seen.has(q.prompt)) return false;
    seen.add(q.prompt);
    return true;
  });

  return unique.slice(0, QUESTION_COUNT);
}

/** The client-facing view — prompts and options, never the answer. */
export function publicQuestions(questions: InternalQuestion[]): QuizQuestion[] {
  return questions.map(({ id, prompt, options }) => ({ id, prompt, options }));
}

/**
 * Scores a submission by regenerating the quiz from its seed. The submitted
 * answers are indexes into the options the client was shown; anything out of
 * range simply counts as wrong rather than erroring, so a malformed answer
 * cannot be used to probe the correct one.
 */
export function scoreQuiz(
  stages: Stage[],
  seed: string,
  answers: ReadonlyArray<{ id: string; answerIndex: number }>
): QuizResult {
  const questions = buildQuiz(stages, seed);
  const byId = new Map(answers.map((a) => [a.id, a.answerIndex]));

  const review = questions.map((q) => {
    const given = byId.get(q.id);
    return {
      id: q.id,
      prompt: q.prompt,
      correct: given === q.answerIndex,
      answer: q.options[q.answerIndex] ?? "",
    };
  });

  const correct = review.filter((r) => r.correct).length;
  return { correct, total: questions.length, passed: correct >= PASS_MARK, review };
}
