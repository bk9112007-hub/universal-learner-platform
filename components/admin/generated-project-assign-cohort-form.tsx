"use client";

import { useActionState } from "react";

import { assignGeneratedProjectToCohortAction, type ProjectFormulatorActionState } from "@/lib/project-formulator/actions";

const initialState: ProjectFormulatorActionState = {};

export function GeneratedProjectAssignCohortForm({
  draftProjectId,
  cohorts
}: {
  draftProjectId: string;
  cohorts: Array<{ id: string; title: string }>;
}) {
  const [state, action] = useActionState(assignGeneratedProjectToCohortAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="draftProjectId" value={draftProjectId} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Assign to cohort</label>
        <select name="cohortId" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.title}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700">
        Assign to Cohort
      </button>
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
    </form>
  );
}
