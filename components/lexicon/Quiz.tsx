"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/lexicon";

const LETTERS = "ABCD";
const R = 26;
const C = 2 * Math.PI * R;

/** Answer-once multiple choice with instant feedback, a score and a retry. */
export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const answered = picked.filter((p) => p !== null).length;
  const score = picked.filter((p, i) => p === questions[i].answer).length;
  const done = answered === questions.length;

  const pick = (qi: number, oi: number) => setPicked((p) => (p[qi] === null ? p.map((v, i) => (i === qi ? oi : v)) : p));

  return (
    <div className="quiz">
      <ol className="quiz-list">
        {questions.map((q, qi) => {
          const choice = picked[qi];
          const locked = choice !== null;
          const right = choice === q.answer;
          return (
            <li key={q.q} className={`quiz-q ${locked ? (right ? "is-right" : "is-wrong") : ""}`}>
              <p className="quiz-prompt" id={`quiz-q-${qi}`}>
                <span className="quiz-num">{qi + 1}</span>
                {q.q}
              </p>
              <div className={`quiz-options ${q.options.length === 2 ? "two" : ""}`} role="group" aria-labelledby={`quiz-q-${qi}`}>
                {q.options.map((o, oi) => {
                  const state = !locked ? "" : oi === q.answer ? "correct" : oi === choice ? "chosen" : "dim";
                  return (
                    <button
                      key={o}
                      type="button"
                      className={`quiz-opt ${state}`}
                      aria-pressed={choice === oi}
                      aria-disabled={locked}
                      onClick={() => pick(qi, oi)}
                    >
                      <span className="quiz-letter" aria-hidden="true">
                        {state === "correct" ? "✓" : state === "chosen" ? "✗" : LETTERS[oi]}
                      </span>
                      {o}
                    </button>
                  );
                })}
              </div>
              <p className="quiz-why" role="status">
                {locked && (
                  <>
                    <strong>{right ? "Correct." : `Not quite. The answer is ${LETTERS[q.answer]}.`}</strong> {q.why}
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ol>

      <div className={`quiz-score ${done ? "done" : ""}`} aria-live="polite">
        <svg viewBox="0 0 60 60" aria-hidden="true">
          <circle cx="30" cy="30" r={R} className="quiz-track" />
          <circle cx="30" cy="30" r={R} className="quiz-fill" strokeDasharray={C} strokeDashoffset={C - (C * (done ? score : answered)) / questions.length} />
        </svg>
        <div>
          <strong>{done ? `${score} of ${questions.length} correct` : `${answered} of ${questions.length} answered`}</strong>
          <p>
            {!done
              ? "Pick an answer to see the rationale."
              : score === questions.length
                ? "Clean regression: every check passed."
                : "Review the rationale above, then run it again."}
          </p>
        </div>
        {answered > 0 && (
          <button type="button" className="btn ghost sm" onClick={() => setPicked(questions.map(() => null))}>
            Retry
          </button>
        )}
      </div>

      <details className="quiz-key">
        <summary>Answer key &amp; rationale</summary>
        <ul>
          {questions.map((q, i) => (
            <li key={q.q}>
              <strong>
                {i + 1} — {q.options.length === 2 ? q.options[q.answer] : LETTERS[q.answer]}.
              </strong>{" "}
              {q.why}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
