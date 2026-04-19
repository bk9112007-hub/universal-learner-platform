"use client";

import { useActionState } from "react";

import { deleteAssessmentAction, type AssessmentActionState } from "@/lib/assessments/actions";

const initialState: AssessmentActionState = {};

export function AssessmentDeleteForm({ assessmentId }: { assessmentId: string }) {
  const [state, action] = useActionState(deleteAssessmentAction, initialState);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="assessmentId" value={assessmentId} />
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
      <button type="submit" className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
        Delete assessment
      </button>
    </form>
  );
}
