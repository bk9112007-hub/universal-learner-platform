"use client";

import { useActionState } from "react";

import {
  saveProjectWorkspaceSummaryAction,
  type ProjectWorkspaceActionState
} from "@/lib/projects/workspace-actions";
import type { PersonalizedProjectRubricRecord, PersonalizedProjectTimelineRecord } from "@/types/domain";

const initialState: ProjectWorkspaceActionState = {};

function formatRubric(rubric: PersonalizedProjectRubricRecord[]) {
  return rubric.map((entry) => `${entry.criterion}: ${entry.description}`).join("\n");
}

function formatTimeline(timeline: PersonalizedProjectTimelineRecord[]) {
  return timeline.map((entry) => `${entry.label}: ${entry.goal}`).join("\n");
}

export function ProjectWorkspaceSummaryForm({
  projectId,
  personalizedReason,
  targetSkills,
  rubric,
  timeline
}: {
  projectId: string;
  personalizedReason: string | null;
  targetSkills: string[];
  rubric: PersonalizedProjectRubricRecord[];
  timeline: PersonalizedProjectTimelineRecord[];
}) {
  const [state, action, pending] = useActionState(saveProjectWorkspaceSummaryAction, initialState);

  return (
    <form action={action} className="space-y-4 rounded-[1.5rem] bg-slate-50 p-4">
      <input type="hidden" name="projectId" value={projectId} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Personalized fit</label>
        <textarea
          name="personalizedReason"
          defaultValue={personalizedReason ?? ""}
          className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Why is this project a strong fit for this learner or group?"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Target skills</label>
        <input
          name="targetSkills"
          defaultValue={targetSkills.join(", ")}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Research, writing, collaboration, data analysis"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Rubric</label>
        <textarea
          name="rubricText"
          defaultValue={formatRubric(rubric)}
          className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Criterion: Description"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Timeline</label>
        <textarea
          name="timelineText"
          defaultValue={formatTimeline(timeline)}
          className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Week 1: Define the challenge"
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save workspace overview"}
      </button>
    </form>
  );
}
