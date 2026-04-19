import type { NotificationType, UserRole } from "@/types/domain";

export type NotificationCatalogEntry = {
  type: NotificationType;
  label: string;
  description: string;
  audience: UserRole;
  defaultEnabled: boolean;
  defaultInAppEnabled: boolean;
  defaultEmailEnabled: boolean;
};

export const NOTIFICATION_CATALOG: NotificationCatalogEntry[] = [
  {
    type: "student_due_soon",
    label: "Student due-soon reminders",
    description: "Remind students when lesson work is coming due within the next three days.",
    audience: "student",
    defaultEnabled: true,
    defaultInAppEnabled: true,
    defaultEmailEnabled: false
  },
  {
    type: "student_overdue",
    label: "Student overdue reminders",
    description: "Alert students when lesson work is overdue and needs immediate attention.",
    audience: "student",
    defaultEnabled: true,
    defaultInAppEnabled: true,
    defaultEmailEnabled: false
  },
  {
    type: "teacher_pending_review",
    label: "Teacher pending-review alerts",
    description: "Surface submitted learner work that is still waiting for teacher review.",
    audience: "teacher",
    defaultEnabled: true,
    defaultInAppEnabled: true,
    defaultEmailEnabled: false
  },
  {
    type: "teacher_overdue_attention",
    label: "Teacher overdue-attention alerts",
    description: "Summarize overdue learner work and students who need teacher attention.",
    audience: "teacher",
    defaultEnabled: true,
    defaultInAppEnabled: true,
    defaultEmailEnabled: false
  },
  {
    type: "parent_due_summary",
    label: "Parent due-soon summaries",
    description: "Show read-only summaries when linked learners have work due soon.",
    audience: "parent",
    defaultEnabled: true,
    defaultInAppEnabled: true,
    defaultEmailEnabled: false
  },
  {
    type: "parent_overdue_summary",
    label: "Parent overdue summaries",
    description: "Show read-only summaries when linked learners have overdue work.",
    audience: "parent",
    defaultEnabled: true,
    defaultInAppEnabled: true,
    defaultEmailEnabled: false
  }
];
