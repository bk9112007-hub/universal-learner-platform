"use client";

import { useActionState } from "react";

import { completeCheckpointTaskAction, type ProgramProgressActionState } from "@/lib/programs/actions";

const initialState: ProgramProgressActionState = {};

export function LessonCheckpointForm({
  slug,
  lessonId,
  taskId,
  defaultValue
}: {
  slug: string;
  lessonId: string;
  taskId: string;
  defaultValue?: string | null;
}) {
  const [state, action, pending] = useActionState(completeCheckpointTaskAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded-[1.5rem] bg-slate-50 p-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="taskId" value={taskId} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Checkpoint response</label>
        <textarea
          name="responseText"
          defaultValue={defaultValue ?? ""}
          className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Add a short answer, evidence note, or checkpoint summary."
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : "Complete checkpoint"}
      </button>
    </form>
  );
}
