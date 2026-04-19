"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function syncLessonProgressForUser({
  userId,
  programId,
  lessonId
}: {
  userId: string;
  programId: string;
  lessonId: string;
}) {
  const supabase = createAdminClient();
  const { data: tasks, error: tasksError } = await supabase.from("lesson_tasks").select("id, is_required").eq("lesson_id", lessonId);

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const taskIds = (tasks ?? []).map((task: any) => task.id);
  if (taskIds.length === 0) {
    return;
  }

  const { data: progressRows, error: progressError } = await supabase
    .from("lesson_task_progress")
    .select("task_id, status, completed_at")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .in("task_id", taskIds);

  if (progressError) {
    throw new Error(progressError.message);
  }

  const progressMap = new Map<string, { status: string; completed_at: string | null }>(
    (progressRows ?? []).map((row: any) => [row.task_id, { status: row.status, completed_at: row.completed_at }])
  );

  const requiredTasks = (tasks ?? []).filter((task: any) => task.is_required);
  const hasAnyStarted = (tasks ?? []).some((task: any) => {
    const status = progressMap.get(task.id)?.status;
    return status && status !== "not_started";
  });
  const allRequiredComplete =
    requiredTasks.length > 0 &&
    requiredTasks.every((task: any) => {
      const status = progressMap.get(task.id)?.status;
      return status === "completed";
    });

  const nextStatus = allRequiredComplete ? "completed" : hasAnyStarted ? "in_progress" : "not_started";
  const completedAt =
    nextStatus === "completed"
      ? requiredTasks
          .map((task: any) => progressMap.get(task.id)?.completed_at)
          .filter(Boolean)
          .sort()
          .slice(-1)[0] ?? new Date().toISOString()
      : null;

  const { error: upsertError } = await supabase.from("user_lesson_progress").upsert(
    {
      user_id: userId,
      program_id: programId,
      lesson_id: lessonId,
      status: nextStatus,
      last_viewed_at: new Date().toISOString(),
      completed_at: completedAt
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }
}
