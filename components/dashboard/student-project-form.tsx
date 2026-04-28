"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import { createProjectSubmissionAction, type ActionState } from "@/lib/projects/actions";
import type { PersonalizedProjectBriefRecord } from "@/types/domain";

const initialState: ActionState = {};

export function StudentProjectForm({
  briefs = []
}: {
  briefs?: PersonalizedProjectBriefRecord[];
}) {
  const [state, action] = useActionState(createProjectSubmissionAction, initialState);
  const [selectedBriefId, setSelectedBriefId] = useState("");
  const selectedBrief = useMemo(() => briefs.find((brief) => brief.id === selectedBriefId) ?? null, [briefs, selectedBriefId]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submissionText, setSubmissionText] = useState("");

  useEffect(() => {
    if (!selectedBrief) {
      return;
    }

    setTitle(selectedBrief.title);
    setSubject(selectedBrief.subject);
    setDescription(selectedBrief.description);
    setSubmissionText(
      `Project brief selected: ${selectedBrief.title}\n\nKey milestones:\n${selectedBrief.milestones.map((milestone) => `- ${milestone.title}: ${milestone.description}`).join("\n")}\n\nReflection:\n`
    );
  }, [selectedBrief]);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {briefs.length > 0 ? (
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Start from a personalized project brief</label>
          <select
            value={selectedBriefId}
            onChange={(event) => setSelectedBriefId(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          >
            <option value="">Start from scratch</option>
            {briefs.map((brief) => (
              <option key={brief.id} value={brief.id}>
                {brief.title}
              </option>
            ))}
          </select>
          {selectedBrief ? (
            <div className="mt-3 rounded-3xl bg-brand-50 p-4 text-sm text-brand-900">
              <p className="font-semibold">{selectedBrief.targetLabel}</p>
              <p className="mt-2">{selectedBrief.description}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      <input type="hidden" name="personalizedBriefId" value={selectedBriefId} />
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Project title</label>
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Sustainable School Garden"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
        <input
          name="subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Science"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Project goal</label>
        <input
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Describe the challenge and outcome."
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Submission details</label>
        <textarea
          name="submissionText"
          value={submissionText}
          onChange={(event) => setSubmissionText(event.target.value)}
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
