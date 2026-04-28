"use client";

import { useActionState } from "react";

import { launchProjectWorkspaceAction, type ProjectWorkspaceActionState } from "@/lib/projects/workspace-actions";

const initialState: ProjectWorkspaceActionState = {};

export function ProjectWorkspaceLaunchForm({ briefId }: { briefId: string }) {
  const [state, action, pending] = useActionState(launchProjectWorkspaceAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="briefId" value={briefId} />
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Opening..." : "Open project workspace"}
      </button>
    </form>
  );
}
