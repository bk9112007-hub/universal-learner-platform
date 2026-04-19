"use client";

import { useActionState } from "react";

import { type AdminActionState, upsertLessonTaskAction } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function ProgramTaskForm({
  lessonId,
  task
}: {
  lessonId: string;
  task?: {
    id: string;
    title: string;
    instructions: string;
    taskType: "checkpoint" | "submission";
    sortOrder: number;
    isRequired: boolean;
    dueDate: string | null;
  };
}) {
  const [state, action] = useActionState(upsertLessonTaskAction, initialState);

  return (
    <form action={action} className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
      <input type="hidden" name="lessonId" value={lessonId} />
      {task ? <input type="hidden" name="taskId" value={task.id} /> : null}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Task title</label>
        <input
          name="title"
          required
          defaultValue={task?.title}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Checkpoint or submission task title"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Task type</label>
        <select
          name="taskType"
          defaultValue={task?.taskType ?? "checkpoint"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="checkpoint">Checkpoint</option>
          <option value="submission">Submission</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Instructions</label>
        <textarea
          name="instructions"
          required
          defaultValue={task?.instructions}
          className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Tell the learner what to complete, upload, or reflect on."
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Sort order</label>
        <input
          name="sortOrder"
          type="number"
          min="0"
          required
          defaultValue={task?.sortOrder ?? 0}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Due date</label>
        <input
          name="dueDate"
          type="date"
          defaultValue={task?.dueDate ?? ""}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Required</label>
        <select
          name="isRequired"
          defaultValue={task ? String(task.isRequired) : "true"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="true">Required</option>
          <option value="false">Optional</option>
        </select>
      </div>
      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          {task ? "Save task" : "Create task"}
        </button>
        {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
        {state.success ? <p className="text-sm font-medium text-emerald-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
