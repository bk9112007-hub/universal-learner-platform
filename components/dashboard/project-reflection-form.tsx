"use client";

import { useActionState } from "react";

import { saveProjectReflectionAction, type ProjectWorkspaceActionState } from "@/lib/projects/workspace-actions";

const initialState: ProjectWorkspaceActionState = {};

export function ProjectReflectionForm({
  projectId,
  defaultValue
}: {
  projectId: string;
  defaultValue?: string | null;
}) {
  const [state, action, pending] = useActionState(saveProjectReflectionAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded-[1.5rem] bg-slate-50 p-4">
      <input type="hidden" name="projectId" value={projectId} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Project reflection</label>
        <textarea
          name="note"
          defaultValue={defaultValue ?? ""}
          required
          className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="What is going well, what still needs work, and what will you do next?"
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save reflection"}
      </button>
    </form>
  );
}
