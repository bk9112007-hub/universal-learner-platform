import { getDeadlineState } from "@/lib/deadlines/state";
import { NOTIFICATION_CATALOG } from "@/lib/notifications/catalog";
import { renderNotificationEmail, sendNotificationEmail } from "@/lib/notifications/email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DeadlineState, NotificationRecord, NotificationType, UserRole } from "@/types/domain";

type NotificationCandidate = {
  userId: string;
  role: UserRole;
  type: NotificationType;
  title: string;
  body: string;
  actionHref: string | null;
  dedupeKey: string;
  emailTo: string | null;
  emailSubject: string;
};

type ChannelSettings = {
  isEnabled: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
};

type SettingsMap = Map<NotificationType, ChannelSettings>;

type SyncStats = {
  usersProcessed: number;
  notificationsCreated: number;
  emailsAttempted: number;
  emailsSent: number;
  emailsFailed: number;
};

function createEmptyStats(): SyncStats {
  return {
    usersProcessed: 0,
    notificationsCreated: 0,
    emailsAttempted: 0,
    emailsSent: 0,
    emailsFailed: 0
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function ensureNotificationSettings() {
  const supabase = createAdminClient();
  const payload = NOTIFICATION_CATALOG.map((entry) => ({
    type: entry.type,
    label: entry.label,
    description: entry.description,
    audience: entry.audience,
    is_enabled: entry.defaultEnabled,
    in_app_enabled: entry.defaultInAppEnabled,
    email_enabled: entry.defaultEmailEnabled
  }));

  await supabase.from("notification_settings").upsert(payload, { onConflict: "type" });
}

async function getGlobalSettingsMap(): Promise<SettingsMap> {
  await ensureNotificationSettings();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notification_settings")
    .select("type, is_enabled, in_app_enabled, email_enabled");

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    (data ?? []).map((row: any) => [
      row.type as NotificationType,
      {
        isEnabled: row.is_enabled,
        inAppEnabled: row.in_app_enabled,
        emailEnabled: row.email_enabled
      }
    ])
  );
}

async function getUserPreferenceMap(userId: string): Promise<Map<string, { inAppEnabled: boolean; emailEnabled: boolean }>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notification_user_preferences")
    .select("type, in_app_enabled, email_enabled")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    (data ?? []).map((row: any) => [
      row.type,
      {
        inAppEnabled: row.in_app_enabled,
        emailEnabled: row.email_enabled
      }
    ])
  );
}

async function getEffectiveSettingsForUser(userId: string, globalSettings: SettingsMap): Promise<SettingsMap> {
  const preferences = await getUserPreferenceMap(userId);
  const map: SettingsMap = new Map();

  for (const [type, setting] of globalSettings.entries()) {
    const preference = preferences.get(type);
    map.set(type, {
      isEnabled: setting.isEnabled,
      inAppEnabled: setting.isEnabled && setting.inAppEnabled && (preference?.inAppEnabled ?? true),
      emailEnabled: setting.isEnabled && setting.emailEnabled && (preference?.emailEnabled ?? false)
    });
  }

  return map;
}

async function fetchProfileMap(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, { fullName: string; email: string | null }>();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
  if (error) {
    throw new Error(error.message);
  }

  return new Map<string, { fullName: string; email: string | null }>(
    (data ?? []).map((profile: any) => [
      profile.id,
      {
        fullName: profile.full_name ?? "User",
        email: profile.email ?? null
      }
    ])
  );
}

async function dispatchNotificationEmail({
  notificationId,
  notificationType,
  role,
  to,
  subject,
  title,
  body,
  actionHref
}: {
  notificationId: string;
  notificationType: NotificationType;
  role: UserRole;
  to: string;
  subject: string;
  title: string;
  body: string;
  actionHref: string | null;
}) {
  const supabase = createAdminClient();
  const attemptedAt = new Date().toISOString();
  const template = renderNotificationEmail({
    role,
    type: notificationType,
    title,
    body,
    actionHref
  });

  const result = await sendNotificationEmail({
    to,
    subject,
    text: template.text,
    html: template.html
  });

  if (result.ok) {
    await supabase
      .from("notifications")
      .update({
        email_status: "sent",
        email_error: null,
        email_attempted_at: attemptedAt,
        email_sent_at: attemptedAt
      })
      .eq("id", notificationId);

    return { attempted: 1, sent: 1, failed: 0 };
  }

  await supabase
    .from("notifications")
    .update({
      email_status: result.skipped ? "skipped" : "failed",
      email_error: result.reason,
      email_attempted_at: attemptedAt
    })
    .eq("id", notificationId);

  return {
    attempted: 1,
    sent: 0,
    failed: result.skipped ? 0 : 1
  };
}

function getNotificationSeverity(type: NotificationType): NotificationRecord["severity"] {
  if (type.includes("overdue")) {
    return "warning";
  }
  if (type.includes("pending_review")) {
    return "success";
  }
  return "info";
}

async function ensureNotification(candidate: NotificationCandidate, settings: ChannelSettings) {
  if (!settings.isEnabled || (!settings.inAppEnabled && !settings.emailEnabled)) {
    return { created: 0, attempted: 0, sent: 0, failed: 0 };
  }

  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("notifications")
    .select("id")
    .eq("dedupe_key", candidate.dedupeKey)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return { created: 0, attempted: 0, sent: 0, failed: 0 };
  }

  const archivedAt = settings.inAppEnabled ? null : new Date().toISOString();
  const emailStatus = settings.emailEnabled ? "queued" : "not_requested";
  const { data: inserted, error: insertError } = await supabase
    .from("notifications")
    .insert({
      user_id: candidate.userId,
      role: candidate.role,
      type: candidate.type,
      title: candidate.title,
      body: candidate.body,
      action_href: candidate.actionHref,
      dedupe_key: candidate.dedupeKey,
      status: settings.inAppEnabled ? "unread" : "read",
      read_at: settings.inAppEnabled ? null : new Date().toISOString(),
      archived_at: archivedAt,
      email_status: emailStatus,
      metadata: {
        severity: getNotificationSeverity(candidate.type)
      }
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Unable to create notification.");
  }

  if (!settings.emailEnabled || !candidate.emailTo) {
    return { created: 1, attempted: 0, sent: 0, failed: 0 };
  }

  const emailResult = await dispatchNotificationEmail({
    notificationId: inserted.id,
    notificationType: candidate.type,
    role: candidate.role,
    to: candidate.emailTo,
    subject: candidate.emailSubject,
    title: candidate.title,
    body: candidate.body,
    actionHref: candidate.actionHref
  });

  return {
    created: 1,
    attempted: emailResult.attempted,
    sent: emailResult.sent,
    failed: emailResult.failed
  };
}

async function buildStudentCandidates(userId: string): Promise<NotificationCandidate[]> {
  const supabase = createAdminClient();
  const [{ data: enrollments, error: enrollmentError }, profileMap] = await Promise.all([
    supabase.from("enrollments").select("program_id").eq("user_id", userId).eq("status", "active"),
    fetchProfileMap([userId])
  ]);

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const programIds = (enrollments ?? []).map((row: any) => row.program_id).filter(Boolean);
  if (programIds.length === 0) {
    return [];
  }

  const { data: lessons, error: lessonError } = await supabase.from("program_lessons").select("id, title, program_id").in("program_id", programIds);
  if (lessonError) {
    throw new Error(lessonError.message);
  }

  const lessonIds = (lessons ?? []).map((lesson: any) => lesson.id);
  if (lessonIds.length === 0) {
    return [];
  }

  const [{ data: tasks, error: taskError }, { data: progressRows, error: progressError }, { data: programs, error: programError }] = await Promise.all([
    supabase.from("lesson_tasks").select("id, lesson_id, title, due_date").in("lesson_id", lessonIds).not("due_date", "is", null),
    supabase.from("lesson_task_progress").select("task_id, status").eq("user_id", userId).in("lesson_id", lessonIds),
    supabase.from("programs").select("id, title, slug").in("id", programIds)
  ]);

  if (taskError) throw new Error(taskError.message);
  if (progressError) throw new Error(progressError.message);
  if (programError) throw new Error(programError.message);

  const lessonMap = new Map<string, any>((lessons ?? []).map((lesson: any) => [lesson.id, lesson]));
  const programMap = new Map<string, any>((programs ?? []).map((program: any) => [program.id, program]));
  const progressMap = new Map<string, string>((progressRows ?? []).map((row: any) => [row.task_id, row.status]));
  const profile = profileMap.get(userId);

  return (tasks ?? [])
    .map((task: any) => {
      const status = progressMap.get(task.id) ?? "not_started";
      const dueState = getDeadlineState(task.due_date, status);
      const lesson = lessonMap.get(task.lesson_id);
      const program = lesson ? programMap.get(lesson.program_id) : null;

      if (!lesson || !program || !["due_soon", "overdue"].includes(dueState)) {
        return null;
      }

      const type = dueState === "overdue" ? "student_overdue" : "student_due_soon";
      return {
        userId,
        role: "student" as const,
        type,
        title: dueState === "overdue" ? `${task.title} is overdue` : `${task.title} is due soon`,
        body: `${program.title} | ${lesson.title}. The task is currently ${String(status).replaceAll("_", " ")} and ${dueState === "overdue" ? "needs immediate attention." : `is due by ${task.due_date}.`}`,
        actionHref: `/app/programs/${program.slug}`,
        dedupeKey: `${type}:${userId}:${task.id}:${dueState === "overdue" ? todayKey() : task.due_date}`,
        emailTo: profile?.email ?? null,
        emailSubject: dueState === "overdue" ? `Overdue work in ${program.title}` : `Upcoming work in ${program.title}`
      } satisfies NotificationCandidate;
    })
    .filter((candidate: NotificationCandidate | null): candidate is NotificationCandidate => Boolean(candidate));
}

async function getTeacherScopeStudentIds(teacherId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("teacher_student_assignments").select("student_id").eq("teacher_id", teacherId);
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: any) => row.student_id);
}

async function getDueTaskStatesForStudents(studentIds: string[]) {
  if (studentIds.length === 0) {
    return [] as Array<{ userId: string; taskId: string; dueState: DeadlineState; status: string }>;
  }

  const supabase = createAdminClient();
  const [{ data: enrollments, error: enrollmentError }, { data: taskProgressRows, error: progressError }] = await Promise.all([
    supabase.from("enrollments").select("user_id, program_id").in("user_id", studentIds).eq("status", "active"),
    supabase.from("lesson_task_progress").select("user_id, task_id, status").in("user_id", studentIds)
  ]);

  if (enrollmentError) throw new Error(enrollmentError.message);
  if (progressError) throw new Error(progressError.message);

  const programIds = Array.from(new Set((enrollments ?? []).map((row: any) => row.program_id).filter(Boolean)));
  if (programIds.length === 0) {
    return [] as Array<{ userId: string; taskId: string; dueState: DeadlineState; status: string }>;
  }

  const { data: lessons, error: lessonError } = await supabase.from("program_lessons").select("id, program_id").in("program_id", programIds);
  if (lessonError) {
    throw new Error(lessonError.message);
  }

  const lessonIds = (lessons ?? []).map((lesson: any) => lesson.id);
  if (lessonIds.length === 0) {
    return [] as Array<{ userId: string; taskId: string; dueState: DeadlineState; status: string }>;
  }

  const { data: tasks, error: taskError } = await supabase.from("lesson_tasks").select("id, lesson_id, due_date").in("lesson_id", lessonIds).not("due_date", "is", null);
  if (taskError) {
    throw new Error(taskError.message);
  }

  const lessonProgramMap = new Map<string, string>((lessons ?? []).map((lesson: any) => [lesson.id, lesson.program_id]));
  const enrollmentMap = new Map<string, Set<string>>();
  for (const row of enrollments ?? []) {
    if (!enrollmentMap.has(row.user_id)) {
      enrollmentMap.set(row.user_id, new Set<string>());
    }
    enrollmentMap.get(row.user_id)?.add(row.program_id);
  }

  const progressMap = new Map<string, string>((taskProgressRows ?? []).map((row: any) => [`${row.user_id}:${row.task_id}`, row.status]));
  const results: Array<{ userId: string; taskId: string; dueState: DeadlineState; status: string }> = [];

  for (const userId of studentIds) {
    const userPrograms = enrollmentMap.get(userId);
    if (!userPrograms?.size) {
      continue;
    }

    for (const task of tasks ?? []) {
      const programId = lessonProgramMap.get(task.lesson_id);
      if (!programId || !userPrograms.has(programId)) {
        continue;
      }

      const status = progressMap.get(`${userId}:${task.id}`) ?? "not_started";
      results.push({
        userId,
        taskId: task.id,
        status,
        dueState: getDeadlineState(task.due_date, status)
      });
    }
  }

  return results;
}

async function buildTeacherCandidates(userId: string): Promise<NotificationCandidate[]> {
  const studentIds = await getTeacherScopeStudentIds(userId);
  if (studentIds.length === 0) {
    return [];
  }

  const supabase = createAdminClient();
  const [profileMap, submissionsResult, dueTaskStates] = await Promise.all([
    fetchProfileMap([userId]),
    supabase.from("submissions").select("id, student_id, status").in("student_id", studentIds).eq("status", "submitted"),
    getDueTaskStatesForStudents(studentIds)
  ]);

  if (submissionsResult.error) {
    throw new Error(submissionsResult.error.message);
  }

  const teacherProfile = profileMap.get(userId);
  const pendingReviewCount = (submissionsResult.data ?? []).length;
  const attentionRows = dueTaskStates.filter((row) => row.dueState === "overdue" || row.status === "needs_revision");
  const overdueLearnerIds = Array.from(new Set(attentionRows.map((row) => row.userId)));

  const candidates: NotificationCandidate[] = [];
  if (pendingReviewCount > 0) {
    candidates.push({
      userId,
      role: "teacher",
      type: "teacher_pending_review",
      title: `${pendingReviewCount} submission${pendingReviewCount === 1 ? "" : "s"} waiting for review`,
      body: "Student work is waiting in your review queue. Open teacher triage to send feedback and keep learners moving.",
      actionHref: "/app/teacher",
      dedupeKey: `teacher_pending_review:${userId}:${todayKey()}`,
      emailTo: teacherProfile?.email ?? null,
      emailSubject: "Review queue summary"
    });
  }

  if (attentionRows.length > 0) {
    candidates.push({
      userId,
      role: "teacher",
      type: "teacher_overdue_attention",
      title: `${overdueLearnerIds.length} learner${overdueLearnerIds.length === 1 ? "" : "s"} need attention`,
      body: `${attentionRows.length} lesson task${attentionRows.length === 1 ? "" : "s"} are overdue or need revision inside your assigned classroom scope.`,
      actionHref: "/app/teacher?due_state=attention",
      dedupeKey: `teacher_overdue_attention:${userId}:${todayKey()}`,
      emailTo: teacherProfile?.email ?? null,
      emailSubject: "Overdue learner attention summary"
    });
  }

  return candidates;
}

async function buildParentCandidates(userId: string): Promise<NotificationCandidate[]> {
  const supabase = createAdminClient();
  const [{ data: links, error: linkError }, profileMap] = await Promise.all([
    supabase.from("parent_student_links").select("student_id").eq("parent_id", userId),
    fetchProfileMap([userId])
  ]);

  if (linkError) {
    throw new Error(linkError.message);
  }

  const childIds = (links ?? []).map((row: any) => row.student_id);
  if (childIds.length === 0) {
    return [];
  }

  const childProfileMap = await fetchProfileMap(childIds);
  const dueTaskStates = await getDueTaskStatesForStudents(childIds);
  const parentProfile = profileMap.get(userId);
  const candidates: NotificationCandidate[] = [];

  for (const childId of childIds) {
    const childName = childProfileMap.get(childId)?.fullName ?? "Learner";
    const childStates = dueTaskStates.filter((row) => row.userId === childId);
    const dueSoonCount = childStates.filter((row) => row.dueState === "due_soon").length;
    const overdueCount = childStates.filter((row) => row.dueState === "overdue").length;

    if (dueSoonCount > 0) {
      candidates.push({
        userId,
        role: "parent",
        type: "parent_due_summary",
        title: `${childName} has work due soon`,
        body: `${dueSoonCount} lesson task${dueSoonCount === 1 ? "" : "s"} are due soon for ${childName}. This is a read-only family summary.`,
        actionHref: "/app/parent#progress",
        dedupeKey: `parent_due_summary:${userId}:${childId}:${todayKey()}`,
        emailTo: parentProfile?.email ?? null,
        emailSubject: `Upcoming work for ${childName}`
      });
    }

    if (overdueCount > 0) {
      candidates.push({
        userId,
        role: "parent",
        type: "parent_overdue_summary",
        title: `${childName} has overdue work`,
        body: `${overdueCount} lesson task${overdueCount === 1 ? "" : "s"} are overdue for ${childName}. Open the parent dashboard for read-only context.`,
        actionHref: "/app/parent#progress",
        dedupeKey: `parent_overdue_summary:${userId}:${childId}:${todayKey()}`,
        emailTo: parentProfile?.email ?? null,
        emailSubject: `Overdue work for ${childName}`
      });
    }
  }

  return candidates;
}

export async function syncNotificationsForUser({
  userId,
  role
}: {
  userId: string;
  role: UserRole;
}) {
  const globalSettings = await getGlobalSettingsMap();
  const effectiveSettings = await getEffectiveSettingsForUser(userId, globalSettings);

  let candidates: NotificationCandidate[] = [];
  if (role === "student") {
    candidates = await buildStudentCandidates(userId);
  } else if (role === "teacher") {
    candidates = await buildTeacherCandidates(userId);
  } else if (role === "parent") {
    candidates = await buildParentCandidates(userId);
  }

  const stats = createEmptyStats();
  stats.usersProcessed = 1;

  for (const candidate of candidates) {
    const result = await ensureNotification(candidate, effectiveSettings.get(candidate.type) ?? { isEnabled: false, inAppEnabled: false, emailEnabled: false });
    stats.notificationsCreated += result.created;
    stats.emailsAttempted += result.attempted;
    stats.emailsSent += result.sent;
    stats.emailsFailed += result.failed;
  }

  return stats;
}

async function startNotificationRun({
  triggerSource,
  triggeredByAdminId
}: {
  triggerSource: string;
  triggeredByAdminId?: string | null;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notification_runs")
    .insert({
      trigger_source: triggerSource,
      triggered_by_admin_id: triggeredByAdminId ?? null,
      status: "running"
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create notification run.");
  }

  return data.id as string;
}

async function finishNotificationRun(runId: string, stats: SyncStats, status: string, summary: string | null, errorMessage: string | null) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("notification_runs")
    .update({
      status,
      completed_at: new Date().toISOString(),
      users_processed: stats.usersProcessed,
      notifications_created: stats.notificationsCreated,
      emails_attempted: stats.emailsAttempted,
      emails_sent: stats.emailsSent,
      emails_failed: stats.emailsFailed,
      summary,
      error_message: errorMessage
    })
    .eq("id", runId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncNotificationsForAllUsers({
  triggerSource = "manual_admin",
  triggeredByAdminId = null
}: {
  triggerSource?: string;
  triggeredByAdminId?: string | null;
} = {}) {
  const supabase = createAdminClient();
  await ensureNotificationSettings();
  const runId = await startNotificationRun({ triggerSource, triggeredByAdminId });

  try {
    const { data: profiles, error } = await supabase.from("profiles").select("id, role").in("role", ["student", "teacher", "parent"]);
    if (error) {
      throw new Error(error.message);
    }

    const stats = createEmptyStats();
    for (const profile of profiles ?? []) {
      const result = await syncNotificationsForUser({ userId: profile.id, role: profile.role as UserRole });
      stats.usersProcessed += result.usersProcessed;
      stats.notificationsCreated += result.notificationsCreated;
      stats.emailsAttempted += result.emailsAttempted;
      stats.emailsSent += result.emailsSent;
      stats.emailsFailed += result.emailsFailed;
    }

    const summary = `Processed ${stats.usersProcessed} users and created ${stats.notificationsCreated} notification record(s).`;
    await finishNotificationRun(runId, stats, "completed", summary, null);
    return { runId, ...stats };
  } catch (error) {
    const stats = createEmptyStats();
    await finishNotificationRun(runId, stats, "failed", null, (error as Error).message);
    throw error;
  }
}

export async function retryNotificationDelivery(notificationId: string) {
  const supabase = createAdminClient();
  const { data: notification, error } = await supabase
    .from("notifications")
    .select("id, user_id, role, title, body, action_href, type")
    .eq("id", notificationId)
    .single();

  if (error || !notification) {
    throw new Error(error?.message ?? "Notification not found.");
  }

  const globalSettings = await getGlobalSettingsMap();
  const effectiveSettings = await getEffectiveSettingsForUser(notification.user_id, globalSettings);
  const setting = effectiveSettings.get(notification.type as NotificationType);
  if (!setting?.emailEnabled) {
    throw new Error("Email delivery is disabled for this notification type.");
  }

  const profileMap = await fetchProfileMap([notification.user_id]);
  const email = profileMap.get(notification.user_id)?.email;
  if (!email) {
    throw new Error("The recipient does not have an email address on file.");
  }

  await dispatchNotificationEmail({
    notificationId: notification.id,
    notificationType: notification.type as NotificationType,
    role: notification.role as UserRole,
    to: email,
    subject: notification.title,
    title: notification.title,
    body: notification.body,
    actionHref: notification.action_href
  });
}
