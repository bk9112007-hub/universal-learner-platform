"use client";

import { useActionState } from "react";

import { submitLessonTaskAction, type ProgramProgressActionState } from "@/lib/programs/actions";

const initialState: ProgramProgressActionState = {};

export function LessonTaskSubmissionForm({
  slug,
  lessonId,
  taskId
}: {
  slug: string;
  lessonId: string;
  taskId: string;
}) {
  const [state, action, pending] = useActionState(submitLessonTaskAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded-[1.5rem] bg-slate-50 p-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="taskId" value={taskId} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Submission response</label>
        <textarea
          name="submissionText"
          required
          className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Describe your work, reasoning, or outcome for this lesson task."
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Attachments</label>
        <input
          name="attachments"
          type="file"
          multiple
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-brand-700 file:px-4 file:py-2 file:text-white"
        />
        <p className="mt-2 text-xs text-slate-500">Up to 3 files, 10 MB each.</p>
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Submitting..." : "Submit task"}
      </button>
    </form>
  );
}
