"use client";

import { useActionState } from "react";

import { createProjectSubmissionAction, type ActionState } from "@/lib/projects/actions";

const initialState: ActionState = {};

export function StudentProjectForm() {
  const [state, action] = useActionState(createProjectSubmissionAction, initialState);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Project title</label>
        <input name="title" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Sustainable School Garden" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
        <input name="subject" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Science" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Project goal</label>
        <input name="description" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Describe the challenge and outcome." />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Submission details</label>
        <textarea
          name="submissionText"
          required
          className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Explain what you built, what you learned, and what support you want next."
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Attach files</label>
        <input
          name="attachments"
          type="file"
          multiple
          className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-600 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-brand-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-800"
        />
        <p className="mt-2 text-xs text-slate-500">Up to 3 files, 10 MB each. PDFs, documents, slides, and images work well here.</p>
      </div>
      {state.error ? <p className="md:col-span-2 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-sm font-medium text-success">{state.success}</p> : null}
      <div className="md:col-span-2">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Submit project
        </button>
      </div>
    </form>
  );
}
