"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/md/Dialog";
import { MdButton } from "@/components/md/Button";
import { Button } from "@/components/ui/Button";
import { StateView } from "@/components/ui/StateView";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiClientError } from "@/lib/api-client";
import { clsx } from "@/lib/clsx";
import {
  useQuizPaper,
  useSubmitQuiz,
  type QuizQuestion,
  type QuizResult,
} from "@/hooks/useQuizQuery";

export interface CertificateQuizProps {
  roadmapId: string;
  open: boolean;
  onClose: () => void;
  /** Fired once, on a passing attempt — the certificate is unlocked by then. */
  onPassed?: () => void;
}

/* ── Icons (24px grid, 1.8 stroke, round caps — §1) ─────────────────────── */

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 4h10v5a5 5 0 0 1-10 0V4Zm10 1h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3m5 4v3m-3 3h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RetryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M17 7 7 17M7 7l10 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TickIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function QuizSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Preparing your quiz</span>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-2 w-full rounded-full" />
      <Skeleton className="mt-6 h-5 w-full" />
      <Skeleton className="mt-2 h-5 w-2/3" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-touch w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

/**
 * One question. Real `<input type="radio">`s sharing the question id as their
 * `name`, so the browser gives arrow-key traversal, roving tab stop and the
 * radiogroup semantics for free rather than this re-implementing them.
 */
function QuestionCard({
  question,
  index,
  total,
  selected,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  selected: number | undefined;
  onSelect: (answerIndex: number) => void;
}) {
  const promptId = `quiz-prompt-${question.id}`;

  return (
    <div>
      <Eyebrow tone="muted">
        Question {index + 1} of {total}
      </Eyebrow>

      <h3 id={promptId} className="mt-4 break-words text-title-lg text-md-on-surface">
        {question.prompt}
      </h3>

      <div role="radiogroup" aria-labelledby={promptId} className="mt-5 space-y-3">
        {question.options.map((option, optionIndex) => {
          const checked = selected === optionIndex;
          return (
            <label
              key={optionIndex}
              className={clsx(
                "press state-layer flex min-h-touch cursor-pointer items-center gap-3 rounded-md border px-4 py-3",
                "transition-[background-color,border-color] duration-fast ease-standard",
                "focus-within:ring-2 focus-within:ring-md-primary focus-within:ring-offset-2 focus-within:ring-offset-md-surface-container-high",
                checked
                  ? "border-md-primary bg-md-primary-container text-md-on-primary-container"
                  : "border-md-outline-variant text-md-on-surface"
              )}
            >
              <input
                type="radio"
                name={question.id}
                value={optionIndex}
                checked={checked}
                onChange={() => onSelect(optionIndex)}
                className="sr-only"
              />
              {/* Shape, not just colour: the selected option gains a filled
                  dot, so the choice survives being read in greyscale (§6). */}
              <span
                aria-hidden
                className={clsx(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                  checked ? "border-current" : "border-md-outline"
                )}
              >
                {checked && <span className="h-2.5 w-2.5 rounded-full bg-current" />}
              </span>
              <span className="min-w-0 break-words text-body-lg">{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ResultView({ result }: { result: QuizResult }) {
  const missed = result.review.filter((row) => !row.correct);

  return (
    <div>
      <div
        className={clsx(
          "flex items-start gap-4 rounded-md border p-4",
          result.passed
            ? "border-md-success/40 bg-md-success-container text-md-on-success-container"
            : "border-md-warning/40 bg-md-warning-container text-md-on-warning-container"
        )}
      >
        <span aria-hidden className="mt-0.5 shrink-0">
          {result.passed ? <TrophyIcon className="h-6 w-6" /> : <RetryIcon className="h-6 w-6" />}
        </span>
        <div className="min-w-0">
          <p className="text-title-md">
            {result.passed ? "Passed — certificate unlocked" : "Not quite yet"}
          </p>
          <p className="mt-1 text-body-md">
            You scored {result.correct} out of {result.total}. The pass mark is {result.passMark}.
          </p>
          <p className="mt-1 text-body-sm opacity-80">
            {result.passed
              ? "Your certificate is now available from your profile."
              : "You can retake it as many times as you like — each attempt asks a different set of questions."}
          </p>
          <p className="mt-1 text-body-sm opacity-80">
            Attempt {result.attempts}
            {missed.length > 0 && ` · ${missed.length} to review`}
          </p>
        </div>
      </div>

      {missed.length > 0 ? (
        <div className="mt-6">
          <Eyebrow tone="muted">What to revisit</Eyebrow>
          <ul className="mt-4 space-y-3">
            {missed.map((row) => (
              <li
                key={row.id}
                className="rounded-md border border-md-outline-variant p-4 text-md-on-surface-variant"
              >
                <div className="flex items-start gap-3">
                  <CrossIcon className="mt-0.5 h-5 w-5 shrink-0 text-md-error" />
                  <div className="min-w-0">
                    <p className="break-words text-body-lg text-md-on-surface">{row.prompt}</p>
                    <p className="mt-2 flex items-start gap-2 break-words text-body-md">
                      <TickIcon className="mt-0.5 h-5 w-5 shrink-0 text-md-success" />
                      <span>
                        <span className="text-md-on-surface-variant">Correct answer: </span>
                        <span className="text-md-on-surface">{row.answer}</span>
                      </span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-6 flex items-center gap-2 text-body-md text-md-on-surface-variant">
          <TickIcon className="h-5 w-5 shrink-0 text-md-success" />
          Every question correct — nothing to review.
        </p>
      )}
    </div>
  );
}

/* ── The dialog ─────────────────────────────────────────────────────────── */

/**
 * The certificate quiz.
 *
 * Routed through `md/Dialog` (CLAUDE.md §5) so a phone gets a full-screen page
 * with a back arrow and hardware-Back wiring rather than a floating card — ten
 * questions is a destination, not a popup.
 *
 * Answers are keyed by question **id**, never by position: a retake fetches a
 * fresh paper whose questions are both different and differently ordered, and
 * an index-keyed map would silently carry the previous attempt's choices over.
 *
 * The paper is only fetched once the dialog is open. The endpoint 400s with a
 * written explanation when the course is unfinished or too short to quiz, and
 * that sentence is the one thing worth showing — it names exactly how many
 * stages are left — so it is surfaced verbatim instead of being flattened into
 * a generic failure message.
 */
export function CertificateQuiz({ roadmapId, open, onClose, onPassed }: CertificateQuizProps) {
  // Bumping this changes the query key, which is what buys a genuinely new
  // seed on a retake; a refetch alone would re-serve the cached paper.
  const [attempt, setAttempt] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);

  const paper = useQuizPaper(roadmapId, open, attempt);
  const submit = useSubmitQuiz();

  // A reopened dialog starts clean, and never on the previous attempt's score.
  useEffect(() => {
    if (open) return;
    setAnswers({});
    setCurrent(0);
    setResult(null);
    submit.reset();
    // `submit` is a stable mutation object; depending on it would re-run this
    // on every status change and wipe a result the moment it arrived.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const questions = useMemo(() => paper.data?.questions ?? [], [paper.data]);
  const total = paper.data?.total ?? questions.length;
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const question = questions[current];
  const isLast = current === questions.length - 1;

  function startFreshAttempt() {
    setAnswers({});
    setCurrent(0);
    setResult(null);
    submit.reset();
    setAttempt((n) => n + 1);
  }

  function handleSubmit() {
    if (!paper.data || !allAnswered) return;
    submit.mutate(
      {
        roadmapId,
        seed: paper.data.seed,
        answers: questions.map((q) => ({ id: q.id, answerIndex: answers[q.id]! })),
      },
      {
        onSuccess: (scored) => {
          setResult(scored);
          if (scored.passed) onPassed?.();
        },
      }
    );
  }

  const loadError =
    paper.error instanceof ApiClientError
      ? paper.error.message
      : paper.error
        ? "Something went wrong preparing your quiz. Please try again."
        : null;

  const submitError =
    submit.error instanceof ApiClientError
      ? submit.error.message
      : submit.error
        ? "Couldn't score that attempt. Please try again."
        : null;

  /* Actions differ per phase, so they're assembled rather than branched in
     the JSX — `Dialog` stacks them full-width on phones either way. */
  let actions: React.ReactNode = null;

  if (result) {
    actions = result.passed ? (
      <MdButton variant="filled" onClick={onClose}>
        Done
      </MdButton>
    ) : (
      <>
        <MdButton variant="text" onClick={onClose}>
          Close
        </MdButton>
        <MdButton variant="filled" icon={<RetryIcon className="h-5 w-5" />} onClick={startFreshAttempt}>
          Retake the quiz
        </MdButton>
      </>
    );
  } else if (questions.length > 0) {
    actions = (
      <>
        <MdButton
          variant="text"
          onClick={() => setCurrent((i) => Math.max(0, i - 1))}
          disabled={current === 0}
        >
          Back
        </MdButton>
        {isLast ? (
          <Button
            variant="accent"
            onClick={handleSubmit}
            disabled={!allAnswered}
            isLoading={submit.isPending}
            loadingLabel="Scoring…"
          >
            Submit answers
          </Button>
        ) : (
          <MdButton
            variant="filled"
            onClick={() => setCurrent((i) => Math.min(questions.length - 1, i + 1))}
          >
            Next question
          </MdButton>
        )}
      </>
    );
  }

  const subtitle = result
    ? `Scored ${result.correct} of ${result.total}`
    : questions.length > 0
      ? `${answeredCount} of ${total} answered · pass mark ${paper.data?.passMark ?? ""}`
      : undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Certificate quiz"
      subtitle={subtitle}
      size="md"
      // Mid-attempt answers are unsaved input, so a stray scrim click must not
      // discard them. Escape and Back still close — both are deliberate.
      dismissible={false}
      actions={actions}
    >
      {paper.isLoading && <QuizSkeleton />}

      {!paper.isLoading && loadError && (
        <StateView
          tone="error"
          title="The quiz isn't open yet"
          description={loadError}
          primary={{ label: "Try again", onClick: startFreshAttempt }}
          secondary={{ label: "Close", onClick: onClose }}
          className="py-6"
        />
      )}

      {!paper.isLoading && !loadError && questions.length === 0 && paper.isSuccess && (
        <StateView
          title="No questions to ask"
          description="This course doesn't have enough material to build a quiz from yet. Add more stages, or come back once it's been expanded."
          primary={{ label: "Close", onClick: onClose }}
          className="py-6"
        />
      )}

      {!result && question && (
        <div>
          {paper.data?.alreadyPassed && (
            <p className="mb-5 flex items-start gap-2 rounded-md bg-md-surface-container-highest px-4 py-3 text-body-sm text-md-on-surface-variant">
              <TrophyIcon className="h-5 w-5 shrink-0 text-md-success" />
              You&apos;ve already passed this one — your certificate stays as it is whatever you
              score.
            </p>
          )}

          {/* Decorative progress strip. Ten pips can't be 48px targets at
              360px wide, so they indicate only; the count in the subtitle and
              the heading below carry the same information as text. */}
          <div aria-hidden className="flex gap-1.5">
            {questions.map((q, i) => (
              <span
                key={q.id}
                className={clsx(
                  "h-1.5 flex-1 rounded-full",
                  i === current
                    ? "bg-md-primary"
                    : answers[q.id] !== undefined
                      ? "bg-md-primary/50"
                      : "bg-md-outline-variant"
                )}
              />
            ))}
          </div>

          <div className="mt-5">
            <QuestionCard
              question={question}
              index={current}
              total={total}
              selected={answers[question.id]}
              onSelect={(answerIndex) =>
                setAnswers((prev) => ({ ...prev, [question.id]: answerIndex }))
              }
            />
          </div>

          {isLast && !allAnswered && (
            <p className="mt-5 text-body-sm text-md-on-surface-variant">
              Answer all {total} questions to submit — {total - answeredCount} still to go.
            </p>
          )}

          {submitError && (
            <p
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-md bg-md-error-container px-4 py-3 text-body-md text-md-on-error-container"
            >
              <CrossIcon className="h-5 w-5 shrink-0" />
              {submitError}
            </p>
          )}
        </div>
      )}

      {result && <ResultView result={result} />}
    </Dialog>
  );
}
