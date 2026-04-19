import Link from "next/link";

import { NotificationItemActions } from "@/components/dashboard/notification-item-actions";
import type { NotificationRecord } from "@/types/domain";

const severityStyles: Record<NotificationRecord["severity"], string> = {
  info: "bg-slate-50 border-slate-200 text-slate-700",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800"
};

export function NotificationFeed({
  notifications,
  emptyLabel
}: {
  notifications: NotificationRecord[];
  emptyLabel: string;
}) {
  if (notifications.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className={`rounded-[1.25rem] border p-4 ${severityStyles[notification.severity]}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">{notification.title}</h3>
              <p className="mt-2 text-sm leading-6">{notification.body}</p>
            </div>
            <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              {notification.type.replaceAll("_", " ")}
            </span>
          </div>
          {notification.actionHref ? (
            <Link href={notification.actionHref} className="mt-4 inline-flex text-sm font-semibold text-brand-800 transition hover:text-brand-950">
              Open workspace
            </Link>
          ) : null}
          <NotificationItemActions notificationId={notification.id} isUnread={notification.status === "unread"} />
        </article>
      ))}
    </div>
  );
}
