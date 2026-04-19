"use client";

import { useActionState } from "react";

import { type AdminActionState, updateNotificationSettingAction } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function NotificationSettingForm({
  setting
}: {
  setting: {
    type: string;
    label: string;
    description: string;
    isEnabled: boolean;
    inAppEnabled: boolean;
    emailEnabled: boolean;
  };
}) {
  const [state, action] = useActionState(updateNotificationSettingAction, initialState);

  return (
    <form action={action} className="rounded-[1.25rem] border border-slate-200 p-4">
      <input type="hidden" name="type" value={setting.type} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">{setting.label}</h3>
          <p className="mt-2 text-sm text-slate-600">{setting.description}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{setting.type}</span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input type="checkbox" name="isEnabled" value="true" defaultChecked={setting.isEnabled} />
          Reminder enabled
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input type="checkbox" name="inAppEnabled" value="true" defaultChecked={setting.inAppEnabled} />
          In-app delivery
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input type="checkbox" name="emailEnabled" value="true" defaultChecked={setting.emailEnabled} />
          Email delivery
        </label>
      </div>
      {state.error ? <p className="mt-3 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="mt-3 text-sm font-medium text-success">{state.success}</p> : null}
      <button type="submit" className="mt-4 rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
        Save reminder
      </button>
    </form>
  );
}
