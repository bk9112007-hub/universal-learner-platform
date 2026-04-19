"use client";

import { useActionState } from "react";

import { type AdminActionState, upsertProgramModuleAction } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function ProgramModuleForm({
  programId,
  module
}: {
  programId: string;
  module?: {
    id: string;
    title: string;
    description: string;
    sortOrder: number;
  };
}) {
  const [state, action] = useActionState(upsertProgramModuleAction, initialState);

  return (
    <form action={action} className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
      <input type="hidden" name="programId" value={programId} />
      {module ? <input type="hidden" name="moduleId" value={module.id} /> : null}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Module title</label>
        <input
          name="title"
          required
          defaultValue={module?.title}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Module title"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Sort order</label>
        <input
          name="sortOrder"
          type="number"
          min="0"
          required
          defaultValue={module?.sortOrder ?? 0}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
        <textarea
          name="description"
          required
          defaultValue={module?.description}
          className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
          placeholder="What this module helps learners achieve."
        />
      </div>
      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          {module ? "Save module" : "Create module"}
        </button>
        {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
        {state.success ? <p className="text-sm font-medium text-emerald-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
