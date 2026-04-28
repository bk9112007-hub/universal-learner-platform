"use client";

import { useActionState } from "react";

import { saveProjectResourceAction, type ProjectWorkspaceActionState } from "@/lib/projects/workspace-actions";
import type { ProjectWorkspaceResourceRecord } from "@/types/domain";

const initialState: ProjectWorkspaceActionState = {};

export function ProjectResourceForm({
  projectId,
  resource
}: {
  projectId: string;
  resource?: ProjectWorkspaceResourceRecord;
}) {
  const [state, action, pending] = useActionState(saveProjectResourceAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded-[1.5rem] bg-slate-50 p-4">
      <input type="hidden" name="projectId" value={projectId} />
      {resource ? <input type="hidden" name="resourceId" value={resource.id} /> : null}
      <div className="grid gap-3 md:grid-cols-[1fr,150px,120px]">
        <input
          name="title"
          required
          defaultValue={resource?.title ?? ""}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Resource title"
        />
        <select
          name="resourceType"
          defaultValue={resource?.resourceType ?? "link"}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="link">Link</option>
          <option value="note">Note</option>
        </select>
        <input
          name="sortOrder"
          type="number"
          min="0"
          defaultValue={resource?.sortOrder ?? 0}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        />
      </div>
      <textarea
        name="description"
        defaultValue={resource?.description ?? ""}
        className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        placeholder="Why should the learner use this resource?"
      />
      <input
        name="externalUrl"
        defaultValue={resource?.externalUrl ?? ""}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        placeholder="https://example.com/resource"
      />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : resource ? "Update resource" : "Add resource"}
      </button>
    </form>
  );
}
