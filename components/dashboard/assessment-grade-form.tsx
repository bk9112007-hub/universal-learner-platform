"use client";

import { useActionState } from "react";

import { gradeAssessmentAction, type AssessmentActionState } from "@/lib/assessments/actions";

const initialState: AssessmentActionState = {};

export function AssessmentGradeForm({ assessmentId }: { assessmentId: string }) {
  const [state, action] = useActionState(gradeAssessmentAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded-3xl bg-slate-50 p-4">
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Score</label>
        <input name="score" type="number" min="0" max="100" step="0.1" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="92" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Teacher notes</label>
        <textarea name="teacherComment" required className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Summarize the learner's strengths and the next steps." />
      </div>
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
      <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
        Save grade
      </button>
    </form>
  );
}
