"use client";

import { useActionState } from "react";

import { saveLessonReflectionAction, type ProgramProgressActionState } from "@/lib/programs/actions";

const initialState: ProgramProgressActionState = {};

export function LessonReflectionForm({
  slug,
  lessonId,
  defaultValue
}: {
  slug: string;
  lessonId: string;
  defaultValue?: string | null;
}) {
  const [state, action, pending] = useActionState(saveLessonReflectionAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded-[1.5rem] bg-slate-50 p-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Reflection / notes</label>
        <textarea
          name="note"
          required
          defaultValue={defaultValue ?? ""}
          className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="What did you learn, what felt challenging, and what will you try next?"
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
