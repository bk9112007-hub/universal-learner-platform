"use client";

import { useActionState } from "react";

import { retryNotificationDeliveryAction, type AdminActionState } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function NotificationRetryForm({ notificationId }: { notificationId: string }) {
  const [state, action] = useActionState(retryNotificationDeliveryAction, initialState);

  return (
    <form action={action} className="rounded-3xl bg-slate-50 p-4">
      <input type="hidden" name="notificationId" value={notificationId} />
      <p className="text-sm text-slate-600">Retry email delivery for this reminder after fixing provider or recipient setup.</p>
      {state.error ? <p className="mt-3 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="mt-3 text-sm font-medium text-success">{state.success}</p> : null}
      <button type="submit" className="mt-4 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900">
        Retry delivery
      </button>
    </form>
  );
}
