"use client";

import { useActionState } from "react";

import { type AdminActionState, upsertProgramLessonAction } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function ProgramLessonForm({
  programId,
  moduleId,
  lesson
}: {
  programId: string;
  moduleId: string;
  lesson?: {
    id: string;
    title: string;
    summary: string;
    content: string;
    sortOrder: number;
    estimatedMinutes: number;
    isPublished: boolean;
  };
}) {
  const [state, action] = useActionState(upsertProgramLessonAction, initialState);

  return (
    <form action={action} className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 md:grid-cols-2">
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="moduleId" value={moduleId} />
      {lesson ? <input type="hidden" name="lessonId" value={lesson.id} /> : null}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Lesson title</label>
        <input
          name="title"
          required
          defaultValue={lesson?.title}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Lesson title"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Summary</label>
        <input
          name="summary"
          required
          defaultValue={lesson?.summary}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Short lesson summary"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Sort order</label>
        <input
          name="sortOrder"
          type="number"
          min="0"
          required
          defaultValue={lesson?.sortOrder ?? 0}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Estimated minutes</label>
        <input
          name="estimatedMinutes"
          type="number"
          min="1"
          required
          defaultValue={lesson?.estimatedMinutes ?? 15}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Lesson content</label>
        <textarea
          name="content"
          required
          defaultValue={lesson?.content ?? "Add the full lesson guidance, learner prompts, and reflection questions here."}
          className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Detailed lesson content"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Visibility</label>
        <select
          name="isPublished"
          defaultValue={lesson ? String(lesson.isPublished) : "true"}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </div>
      <div className="flex items-end">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          {lesson ? "Save lesson" : "Create lesson"}
        </button>
      </div>
      {state.error ? <p className="md:col-span-2 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-sm font-medium text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
