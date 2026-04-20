"use client";

import { useActionState } from "react";

import { submitQuizAttemptAction, type AssessmentActionState } from "@/lib/assessments/actions";
import type { QuizQuestionRecord } from "@/types/domain";

const initialState: AssessmentActionState = {};

export function StudentQuizAttemptForm({
  assessmentId,
  questions,
  locked
}: {
  assessmentId: string;
  questions: QuizQuestionRecord[];
  locked: boolean;
}) {
  const [state, action] = useActionState(submitQuizAttemptAction, initialState);
  const responseSeed = Object.fromEntries(questions.map((question) => [question.id, question.responseText ?? ""]));

  return (
    <form
      action={async (formData) => {
        const payload = Object.fromEntries(
          questions.map((question) => [question.id, String(formData.get(`question-${question.id}`) ?? "")])
        );
        formData.set("responsesPayload", JSON.stringify(payload));
        await action(formData);
      }}
      className="space-y-5"
    >
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <input type="hidden" name="responsesPayload" value={JSON.stringify(responseSeed)} />

      {questions.map((question, index) => (
        <article key={question.id} className="rounded-[1.5rem] border border-slate-200 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Question {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{question.prompt}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {question.topic} | {question.points} point{question.points === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            {question.questionType === "short_answer" ? (
              <textarea
                name={`question-${question.id}`}
                defaultValue={question.responseText ?? ""}
                disabled={locked}
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500 disabled:bg-slate-50"
                placeholder="Type your answer here."
              />
            ) : (
              <div className="space-y-3">
                {question.options.map((option) => (
                  <label key={option} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      defaultChecked={question.responseText === option}
                      disabled={locked}
                      className="h-4 w-4"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {locked && question.aiFeedback ? (
            <div className="mt-4 rounded-3xl bg-brand-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">AI feedback</p>
              <p className="mt-2 text-sm leading-6 text-brand-900">{question.aiFeedback}</p>
            </div>
          ) : null}
        </article>
      ))}

      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
      {!locked ? (
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Submit quiz for AI grading
        </button>
      ) : null}
    </form>
  );
}
