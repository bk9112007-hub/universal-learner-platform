"use client";

import { useActionState } from "react";

import { saveProjectMilestoneAction, type ProjectWorkspaceActionState } from "@/lib/projects/workspace-actions";
import type { ProjectWorkspaceMilestoneRecord } from "@/types/domain";

const initialState: ProjectWorkspaceActionState = {};

export function ProjectMilestoneForm({
  projectId,
  milestone
}: {
  projectId: string;
  milestone?: ProjectWorkspaceMilestoneRecord;
}) {
  const [state, action, pending] = useActionState(saveProjectMilestoneAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded-[1.5rem] bg-slate-50 p-4">
      <input type="hidden" name="projectId" value={projectId} />
      {milestone ? <input type="hidden" name="milestoneId" value={milestone.id} /> : null}
      <div className="grid gap-3 md:grid-cols-[1fr,140px,120px]">
        <input
          name="title"
          required
          defaultValue={milestone?.title ?? ""}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Milestone title"
        />
        <input
          name="dueDate"
          type="date"
          defaultValue={milestone?.dueDate ?? ""}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        />
        <input
          name="sortOrder"
          type="number"
          min="0"
          defaultValue={milestone?.sortOrder ?? 0}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Order"
        />
      </div>
      <textarea
        name="description"
        defaultValue={milestone?.description ?? ""}
        className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        placeholder="What should be accomplished in this milestone?"
      />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : milestone ? "Update milestone" : "Add milestone"}
      </button>
    </form>
  );
}
