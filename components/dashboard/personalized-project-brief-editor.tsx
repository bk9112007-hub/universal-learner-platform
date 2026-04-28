"use client";

import { useActionState } from "react";

import {
  regeneratePersonalizedProjectBriefAction,
  type PersonalizedProjectActionState,
  updatePersonalizedProjectBriefAction
} from "@/lib/projects/personalization";
import type { PersonalizedProjectBriefRecord } from "@/types/domain";

const initialState: PersonalizedProjectActionState = {};

function milestonesToText(brief: PersonalizedProjectBriefRecord) {
  return brief.milestones.map((milestone) => `${milestone.title}: ${milestone.description}`).join("\n");
}

function rubricToText(brief: PersonalizedProjectBriefRecord) {
  return brief.rubric.map((item) => `${item.criterion}: ${item.description}`).join("\n");
}

function timelineToText(brief: PersonalizedProjectBriefRecord) {
  return brief.timeline.map((item) => `${item.label}: ${item.goal}`).join("\n");
}

export function PersonalizedProjectBriefEditor({ brief }: { brief: PersonalizedProjectBriefRecord }) {
  const [updateState, updateAction] = useActionState(updatePersonalizedProjectBriefAction, initialState);
  const [regenerateState, regenerateAction] = useActionState(regeneratePersonalizedProjectBriefAction, initialState);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr,0.32fr]">
      <form action={updateAction} className="grid gap-4">
        <input type="hidden" name="briefId" value={brief.id} />
        <label className="block text-sm font-semibold text-slate-700">
          Project title
          <input name="title" defaultValue={brief.title} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Subject
          <input name="subject" defaultValue={brief.subject} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Description
          <textarea name="description" defaultValue={brief.description} className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Milestones
          <textarea name="milestonesText" defaultValue={milestonesToText(brief)} className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Skills targeted
          <input name="skillsTargetedText" defaultValue={brief.skillsTargeted.join(", ")} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Rubric
          <textarea name="rubricText" defaultValue={rubricToText(brief)} className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Timeline
          <textarea name="timelineText" defaultValue={timelineToText(brief)} className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </label>
        {updateState.error ? <p className="text-sm text-danger">{updateState.error}</p> : null}
        {updateState.success ? <p className="text-sm text-emerald-700">{updateState.success}</p> : null}
        <div>
          <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
            Save edits
          </button>
        </div>
      </form>
      <form action={regenerateAction} className="rounded-[1.5rem] border border-slate-200 p-4">
        <input type="hidden" name="briefId" value={brief.id} />
        <p className="text-sm font-semibold text-ink">Regenerate with AI personalization</p>
        <p className="mt-2 text-sm text-slate-600">
          Rebuild the title, milestones, rubric, and timeline from the saved learner profiles, strengths, weaknesses, and teacher priorities.
        </p>
        {regenerateState.error ? <p className="mt-3 text-sm text-danger">{regenerateState.error}</p> : null}
        {regenerateState.success ? <p className="mt-3 text-sm text-emerald-700">{regenerateState.success}</p> : null}
        <button type="submit" className="mt-4 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900">
          Regenerate brief
        </button>
      </form>
    </div>
  );
}
