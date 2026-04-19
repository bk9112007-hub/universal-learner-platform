import { NextResponse } from "next/server";

import { logEvent } from "@/lib/observability/logger";
import { syncNotificationsForAllUsers } from "@/lib/notifications/service";

function isAuthorized(request: Request) {
  const secret = process.env.NOTIFICATION_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  const headerSecret = request.headers.get("x-notification-cron-secret")?.trim() ?? "";

  return bearer === secret || headerSecret === secret;
}

async function runSync(request: Request) {
  if (!isAuthorized(request)) {
    logEvent("warn", "notifications.sync", "Rejected unauthorized reminder sync request.");
    return NextResponse.json({ error: "Unauthorized notification sync request." }, { status: 401 });
  }

  try {
    const result = await syncNotificationsForAllUsers({ triggerSource: "cron" });
    logEvent("info", "notifications.sync", "Completed scheduled reminder sync.", result);
    return NextResponse.json({
      ok: true,
      runId: result.runId,
      usersProcessed: result.usersProcessed,
      notificationsCreated: result.notificationsCreated,
      emailsAttempted: result.emailsAttempted,
      emailsSent: result.emailsSent,
      emailsFailed: result.emailsFailed
    });
  } catch (error) {
    logEvent("error", "notifications.sync", "Reminder sync failed.", {
      error: (error as Error).message
    });
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return runSync(request);
}

export async function POST(request: Request) {
  return runSync(request);
}
