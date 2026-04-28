"use client";

import { useActionState } from "react";

import { updateProjectChecklistTaskAction, type ProjectWorkspaceActionState } from "@/lib/projects/workspace-actions";

const initialState: ProjectWorkspaceActionState = {};

export function ProjectChecklistTaskForm({
  projectId,
  taskId,
  defaultValue
}: {
  projectId: string;
  taskId: string;
  defaultValue?: string | null;
}) {
  const [state, action, pending] = useActionState(updateProjectChecklistTaskAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded-[1.5rem] bg-slate-50 p-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="taskId" value={taskId} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Task note</label>
        <textarea
          name="responseText"
          defaultValue={defaultValue ?? ""}
          className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Add notes or evidence for this checklist item."
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="status"
          value="in_progress"
          disabled={pending}
          className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Mark in progress
        </button>
        <button
          type="submit"
          name="status"
          value="completed"
          disabled={pending}
          className="rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Mark complete
        </button>
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
