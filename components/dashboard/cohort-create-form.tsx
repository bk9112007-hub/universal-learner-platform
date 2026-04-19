"use client";

import { useActionState } from "react";

import { createCohortAction, type ClassroomActionState } from "@/lib/classroom/actions";

const initialState: ClassroomActionState = {};

export function CohortCreateForm({
  programs
}: {
  programs: Array<{ id: string; title: string }>;
}) {
  const [state, action] = useActionState(createCohortAction, initialState);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Cohort name</label>
        <input
          name="title"
          required
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Spring scholars"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Program</label>
        <select name="programId" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="">General cohort</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.title}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
        <textarea
          name="description"
          required
          className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Describe the cohort focus, pacing, or support model."
        />
      </div>
      {state.error ? <p className="md:col-span-2 text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-sm text-emerald-700">{state.success}</p> : null}
      <div className="md:col-span-2">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Create cohort
        </button>
      </div>
    </form>
  );
}
