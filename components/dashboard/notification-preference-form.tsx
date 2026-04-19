"use client";

import { useActionState } from "react";

import { type NotificationActionState, updateNotificationPreferenceAction } from "@/lib/notifications/actions";

const initialState: NotificationActionState = {};

export function NotificationPreferenceForm({
  preference
}: {
  preference: {
    type: string;
    label: string;
    description: string;
    globalEnabled: boolean;
    globalInAppEnabled: boolean;
    globalEmailEnabled: boolean;
    inAppEnabled: boolean;
    emailEnabled: boolean;
  };
}) {
  const [state, action] = useActionState(updateNotificationPreferenceAction, initialState);

  return (
    <form action={action} className="rounded-[1.25rem] border border-slate-200 p-4">
      <input type="hidden" name="type" value={preference.type} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink">{preference.label}</h3>
          <p className="mt-2 text-sm text-slate-600">{preference.description}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {preference.globalEnabled ? "Globally enabled" : "Globally disabled"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="inAppEnabled"
            value="true"
            defaultChecked={preference.inAppEnabled}
            disabled={!preference.globalEnabled || !preference.globalInAppEnabled}
          />
          In-app notifications
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="emailEnabled"
            value="true"
            defaultChecked={preference.emailEnabled}
            disabled={!preference.globalEnabled || !preference.globalEmailEnabled}
          />
          Email notifications
        </label>
      </div>
      {!preference.globalEmailEnabled ? <p className="mt-3 text-xs text-slate-500">Email is currently disabled globally for this reminder type.</p> : null}
      {state.error ? <p className="mt-3 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="mt-3 text-sm font-medium text-success">{state.success}</p> : null}
      <button type="submit" className="mt-4 rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
        Save preferences
      </button>
    </form>
  );
}
