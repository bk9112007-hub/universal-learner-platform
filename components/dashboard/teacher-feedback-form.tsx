"use client";

import { useActionState } from "react";

import { createTeacherFeedbackAction, type ActionState } from "@/lib/projects/actions";

const initialState: ActionState = {};

export function TeacherFeedbackForm({
  submissionId,
  projectId,
  studentId
}: {
  submissionId: string;
  projectId: string;
  studentId: string;
}) {
  const [state, action] = useActionState(createTeacherFeedbackAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded-3xl bg-slate-50 p-4">
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="studentId" value={studentId} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Score</label>
        <input name="score" type="number" min="0" max="10" step="0.1" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="8.5" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Feedback</label>
        <textarea name="comment" required className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Highlight strengths, next steps, and anything the student should revise." />
      </div>
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
      <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
        Send feedback
      </button>
    </form>
  );
}
