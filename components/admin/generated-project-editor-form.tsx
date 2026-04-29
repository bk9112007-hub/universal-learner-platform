"use client";

import { useActionState } from "react";

import { updateGeneratedProjectDraftAction, type ProjectFormulatorActionState } from "@/lib/project-formulator/actions";
import type { GeneratedProjectRecord } from "@/types/domain";

const initialState: ProjectFormulatorActionState = {};

export function GeneratedProjectEditorForm({ project }: { project: GeneratedProjectRecord }) {
  const [state, action] = useActionState(updateGeneratedProjectDraftAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="draftProjectId" value={project.id} />
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
          <input name="subject" required defaultValue={project.subject} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Skill goal</label>
          <input name="skillGoal" required defaultValue={project.skillGoal} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Grade band</label>
          <input name="gradeBand" required defaultValue={project.gradeBand} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Difficulty</label>
          <input name="difficulty" required defaultValue={project.difficulty} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Duration</label>
          <input name="duration" required defaultValue={project.duration} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Student interests</label>
          <input name="studentInterests" defaultValue={project.studentInterests.join(", ")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Title</label>
        <input name="title" required defaultValue={project.title} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Summary</label>
        <textarea name="summary" required defaultValue={project.summary} className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Student mission</label>
        <textarea name="studentMission" required defaultValue={project.studentMission} className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Learning goals</label>
          <textarea name="learningGoals" required defaultValue={project.learningGoals.join("\n")} className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Steps</label>
          <textarea name="steps" required defaultValue={project.steps.join("\n")} className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Materials</label>
          <textarea name="materials" required defaultValue={project.materials.join("\n")} className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Rubric</label>
          <textarea name="rubric" required defaultValue={project.rubric.join("\n")} className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Reflection questions</label>
        <textarea name="reflectionQuestions" required defaultValue={project.reflectionQuestions.join("\n")} className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" name="intent" value="save_draft" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Save Draft
        </button>
        <button type="submit" name="intent" value="approve" className="rounded-full border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
          Approve
        </button>
        <button type="submit" name="intent" value="assign_later" className="rounded-full border border-sky-200 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50">
          Assign Later
        </button>
        <button type="submit" name="intent" value="archive" className="rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
          Archive
        </button>
      </div>
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
    </form>
  );
}
