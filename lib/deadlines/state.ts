import type { DeadlineState } from "@/types/domain";

export function getDeadlineState(dueDate: string | null, status: string): DeadlineState {
  if (status === "submitted") {
    return "awaiting_feedback";
  }

  if (!dueDate) {
    return "upcoming";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0 && !["completed", "reviewed"].includes(status)) {
    return "overdue";
  }
  if (diffDays <= 3 && !["completed", "reviewed"].includes(status)) {
    return "due_soon";
  }

  return "upcoming";
}
