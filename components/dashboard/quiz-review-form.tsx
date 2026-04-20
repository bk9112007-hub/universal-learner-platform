"use client";

import { useActionState } from "react";

import { reviewQuizAssessmentAction, type AssessmentActionState } from "@/lib/assessments/actions";

const initialState: AssessmentActionState = {};

export function QuizReviewForm({
  assessmentId,
  existingComment,
  existingOverrideScore
}: {
  assessmentId: string;
  existingComment: string | null;
  existingOverrideScore: number | null;
}) {
  const [state, action] = useActionState(reviewQuizAssessmentAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded-3xl bg-slate-50 p-4">
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Human feedback</label>
        <textarea
          name="teacherComment"
          required
          defaultValue={existingComment ?? ""}
          className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Add coaching notes, clarify misconceptions, and set the next step."
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Override score</label>
        <input
          name="overrideScore"
          type="number"
          min="0"
          max="100"
          step="0.1"
          defaultValue={existingOverrideScore ?? ""}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Optional"
        />
      </div>
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
      <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
        Save review
      </button>
    </form>
  );
}
