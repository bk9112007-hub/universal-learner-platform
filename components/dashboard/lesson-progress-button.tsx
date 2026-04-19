"use client";

import { useActionState } from "react";

import { updateLessonProgressAction, type ProgramProgressActionState } from "@/lib/programs/actions";

const initialState: ProgramProgressActionState = {};

export function LessonProgressButton({
  slug,
  lessonId,
  status,
  label
}: {
  slug: string;
  lessonId: string;
  status: "in_progress" | "completed";
  label: string;
}) {
  const [state, action, pending] = useActionState(updateLessonProgressAction, initialState);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : label}
      </button>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
