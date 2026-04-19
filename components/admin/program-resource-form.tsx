"use client";

import { useActionState } from "react";

import { type AdminActionState, upsertProgramResourceAction } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function ProgramResourceForm({
  programId,
  modules,
  resource
}: {
  programId: string;
  modules: Array<{
    id: string;
    title: string;
    lessons: Array<{ id: string; title: string }>;
  }>;
  resource?: {
    id: string;
    title: string;
    description: string;
    resourceType: "link" | "file";
    externalUrl: string | null;
    fileName: string | null;
    bucket: string | null;
    storagePath: string | null;
    moduleId: string | null;
    lessonId: string | null;
    isPublished: boolean;
  };
}) {
  const [state, action] = useActionState(upsertProgramResourceAction, initialState);

  return (
    <form action={action} className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
      <input type="hidden" name="programId" value={programId} />
      {resource ? <input type="hidden" name="resourceId" value={resource.id} /> : null}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Resource title</label>
        <input
          name="title"
          required
          defaultValue={resource?.title}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Workbook, checklist, slide deck..."
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Resource type</label>
        <select
          name="resourceType"
          defaultValue={resource?.resourceType ?? "link"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="link">External link</option>
          <option value="file">Protected file upload</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
        <textarea
          name="description"
          required
          defaultValue={resource?.description}
          className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Explain what the learner should use this for."
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Module</label>
        <select
          name="moduleId"
          defaultValue={resource?.moduleId ?? ""}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="">Program-wide resource</option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Lesson</label>
        <select
          name="lessonId"
          defaultValue={resource?.lessonId ?? ""}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="">No specific lesson</option>
          {modules.flatMap((module) =>
            module.lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {module.title}: {lesson.title}
              </option>
            ))
          )}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">External URL</label>
        <input
          name="externalUrl"
          defaultValue={resource?.externalUrl ?? ""}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Protected file</label>
        <input name="file" type="file" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-brand-700 file:px-4 file:py-2 file:text-white" />
        {resource?.fileName ? <p className="mt-2 text-xs text-slate-500">Current file: {resource.fileName}</p> : null}
      </div>
      <input type="hidden" name="existingBucket" value={resource?.bucket ?? ""} />
      <input type="hidden" name="existingStoragePath" value={resource?.storagePath ?? ""} />
      <input type="hidden" name="existingFileName" value={resource?.fileName ?? ""} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Visibility</label>
        <select
          name="isPublished"
          defaultValue={resource ? String(resource.isPublished) : "true"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </div>
      <div className="flex items-end">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          {resource ? "Save resource" : "Create resource"}
        </button>
      </div>
      {state.error ? <p className="md:col-span-2 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-sm font-medium text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
