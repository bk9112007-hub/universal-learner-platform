"use client";

import { useActionState } from "react";

import { saveProjectTaskAction, type ProjectWorkspaceActionState } from "@/lib/projects/workspace-actions";
import type { ProjectWorkspaceMilestoneRecord, ProjectWorkspaceTaskRecord } from "@/types/domain";

const initialState: ProjectWorkspaceActionState = {};

export function ProjectTaskForm({
  projectId,
  milestones,
  task
}: {
  projectId: string;
  milestones: ProjectWorkspaceMilestoneRecord[];
  task?: ProjectWorkspaceTaskRecord;
}) {
  const [state, action, pending] = useActionState(saveProjectTaskAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded-[1.5rem] bg-slate-50 p-4">
      <input type="hidden" name="projectId" value={projectId} />
      {task ? <input type="hidden" name="taskId" value={task.id} /> : null}
      <div className="grid gap-3 md:grid-cols-[1fr,170px]">
        <input
          name="title"
          required
          defaultValue={task?.title ?? ""}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Task title"
        />
        <select
          name="taskType"
          defaultValue={task?.taskType ?? "checklist"}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="checklist">Checklist</option>
          <option value="submission">Submission</option>
        </select>
      </div>
      <textarea
        name="description"
        defaultValue={task?.description ?? ""}
        className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        placeholder="Task guidance"
      />
      <div className="grid gap-3 md:grid-cols-[1fr,140px,120px]">
        <select
          name="milestoneId"
          defaultValue={task?.milestoneId ?? ""}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="">No milestone</option>
          {milestones.map((milestone) => (
            <option key={milestone.id} value={milestone.id}>
              {milestone.title}
            </option>
          ))}
        </select>
        <input
          name="dueDate"
          type="date"
          defaultValue={task?.dueDate ?? ""}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        />
        <input
          name="sortOrder"
          type="number"
          min="0"
          defaultValue={task?.sortOrder ?? 0}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        />
      </div>
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="hidden"
          name="isRequired"
          value="false"
        />
        <input
          type="checkbox"
          name="isRequired"
          value="true"
          defaultChecked={task ? task.isRequired : true}
          className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
        />
        Required task
      </label>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : task ? "Update task" : "Add task"}
      </button>
    </form>
  );
}
