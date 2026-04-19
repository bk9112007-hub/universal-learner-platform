"use client";

import { useActionState } from "react";

import { type AdminActionState, runNotificationSyncAction } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function NotificationSyncForm() {
  const [state, action] = useActionState(runNotificationSyncAction, initialState);

  return (
    <form action={action} className="rounded-[1.5rem] border border-slate-200 p-5">
      <p className="text-sm text-slate-600">
        Run the reminder engine across student, teacher, and parent accounts using the current due-state, cohort, and linked-child data.
      </p>
      {state.error ? <p className="mt-3 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="mt-3 text-sm font-medium text-success">{state.success}</p> : null}
      <button type="submit" className="mt-4 rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
        Run reminder sync
      </button>
    </form>
  );
}
