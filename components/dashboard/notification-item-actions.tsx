"use client";

import { useActionState } from "react";

import { archiveNotificationAction, markNotificationReadAction, type NotificationActionState } from "@/lib/notifications/actions";

const initialState: NotificationActionState = {};

export function NotificationItemActions({
  notificationId,
  isUnread
}: {
  notificationId: string;
  isUnread: boolean;
}) {
  const [readState, readAction] = useActionState(markNotificationReadAction, initialState);
  const [archiveState, archiveAction] = useActionState(archiveNotificationAction, initialState);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {isUnread ? (
        <form action={readAction}>
          <input type="hidden" name="notificationId" value={notificationId} />
          <button type="submit" className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900">
            Mark read
          </button>
        </form>
      ) : null}
      <form action={archiveAction}>
        <input type="hidden" name="notificationId" value={notificationId} />
        <button type="submit" className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900">
          Dismiss
        </button>
      </form>
      {readState.error || archiveState.error ? (
        <p className="text-xs font-medium text-danger">{readState.error ?? archiveState.error}</p>
      ) : null}
    </div>
  );
}
