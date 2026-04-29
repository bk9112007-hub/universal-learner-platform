export type UserRole = "student" | "teacher" | "parent" | "admin";
export type ProjectStatus = "draft" | "submitted" | "reviewed" | "needs_revision";
export type AssessmentStatus = "assigned" | "submitted" | "graded";
export type SkillBand = "well_below" | "below" | "at" | "above" | "advanced";

export type NavLink = {
  href: string;
  label: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export type Program = {
  title: string;
  description: string;
  price: string;
  cta: string;
  href: string;
  badge?: string;
};

export type ProjectCatalogType = "hooks" | "roles" | "scenarios" | "activities" | "outputs";
export type ProjectCatalogStatus = "draft" | "approved" | "archived";
export type ProjectExperienceType =
  | "guided_tour"
  | "interactive_map"
  | "math_lab"
  | "science_simulation"
  | "timeline"
  | "museum_exhibit"
  | "mission_dashboard"
  | "debate_trial"
  | "business_pitch"
  | "data_lab";

export type ProjectCatalogItemRecord = {
  id: string;
  type: ProjectCatalogType;
  title: string;
  summary: string;
  details: string;
  status: ProjectCatalogStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type ProjectCatalogSummaryRecord = {
  type: ProjectCatalogType;
  title: string;
  description: string;
  href: string;
  totalCount: number;
  draftCount: number;
  approvedCount: number;
  archivedCount: number;
  accessLabel: string;
};

export type GeneratedProjectApprovalStatus = "draft" | "needs_review" | "approved" | "assigned" | "archived";

export type GeneratedProjectSnapshotRecord = {
  id: string;
  title: string;
  summary: string;
  details: string;
  status: ProjectCatalogStatus;
};

export type GeneratedProjectRecord = {
  id: string;
  subject: string;
  skillGoal: string;
  gradeBand: string;
  difficulty: string;
  duration: string;
  studentInterests: string[];
  experienceType: ProjectExperienceType;
  title: string;
  summary: string;
  studentMission: string;
  learningGoals: string[];
  steps: string[];
  materials: string[];
  rubric: string[];
  reflectionQuestions: string[];
  approvalStatus: GeneratedProjectApprovalStatus;
  hookSnapshot: GeneratedProjectSnapshotRecord;
  roleSnapshot: GeneratedProjectSnapshotRecord;
  scenarioSnapshot: GeneratedProjectSnapshotRecord;
  activitySnapshot: GeneratedProjectSnapshotRecord;
  outputSnapshot: GeneratedProjectSnapshotRecord;
  createdAt: string;
  updatedAt: string;
};

export type GeneratedProjectAssignmentRecord = {
  id: string;
  generatedProjectId: string;
  generatedProjectTitle: string;
  studentId: string;
  studentName: string;
  cohortId: string | null;
  cohortTitle: string | null;
  projectId: string | null;
  status: "assigned" | "launched" | "archived";
  createdAt: string;
};

export type ShopifyProductSummary = {
  id: string;
  title: string;
  handle: string;
  description: string;
  price: string;
  cta: string;
  href: string;
  badge?: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  collectionTitles: string[];
};

export type ShopifyCollectionSummary = {
  id: string;
  title: string;
  handle: string;
  description: string;
  href: string;
  imageUrl: string | null;
  imageAlt: string | null;
  productCountLabel: string;
  featuredProductTitles: string[];
};

export type ShopifyArticleSummary = {
  id: string;
  title: string;
  handle: string;
  blogHandle: string;
  excerpt: string;
  publishedAt: string;
  author: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  href: string;
};

export type ShopifyArticleDetail = ShopifyArticleSummary & {
  contentHtml: string;
  blogTitle: string;
};

export type DashboardCard = {
  title: string;
  value: string;
  detail: string;
};

export type DashboardActivity = {
  title: string;
  timestamp: string;
};

export type StudentProjectRecord = {
  id: string;
  title: string;
  subject: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  personalizedBriefId: string | null;
  personalizedBriefTitle: string | null;
  latestSubmissionId: string | null;
  latestSubmissionText: string | null;
  latestFeedbackComment: string | null;
  latestFeedbackScore: number | null;
  latestFeedbackTeacher: string | null;
  files: SubmissionFileRecord[];
};

export type TeacherSubmissionRecord = {
  submissionId: string;
  projectId: string;
  studentId: string;
  studentName: string;
  personalizedBriefId: string | null;
  personalizedBriefTitle: string | null;
  title: string;
  subject: string;
  description: string;
  contextLabel: string | null;
  submissionText: string;
  projectStatus: ProjectStatus;
  submittedAt: string;
  feedbackComment: string | null;
  feedbackScore: number | null;
  feedbackTeacher: string | null;
  files: SubmissionFileRecord[];
};

export type SubmissionFileRecord = {
  id: string;
  fileName: string;
  mimeType: string | null;
  storagePath: string;
  downloadUrl: string | null;
};

export type AssessmentRecord = {
  id: string;
  title: string;
  subject: string;
  description: string;
  status: AssessmentStatus;
  dueDate: string | null;
  assignedAt: string;
  score: number | null;
  aiScore: number | null;
  teacherOverrideScore: number | null;
  aiFeedback: string | null;
  teacherComment: string | null;
  studentId: string;
  studentName: string | null;
  teacherId: string;
  topic: string | null;
  source: "manual" | "ai";
  cohortId: string | null;
  questionCount: number;
  weakTopics: string[];
};

export type QuizQuestionType = "multiple_choice" | "short_answer" | "true_false";

export type QuizQuestionRecord = {
  id: string;
  assessmentId: string;
  prompt: string;
  questionType: QuizQuestionType;
  topic: string;
  sortOrder: number;
  points: number;
  options: string[];
  explanation: string | null;
  responseText: string | null;
  isCorrect: boolean | null;
  scoreAwarded: number | null;
  aiFeedback: string | null;
};

export type TeacherQuizAnalyticsRecord = {
  topic: string;
  missCount: number;
  learnerCount: number;
};

export type ParentChildRecord = {
  studentId: string;
  studentName: string;
  projectCount: number;
  submissionCount: number;
  feedbackCount: number;
  gradedAssessmentCount: number;
  averageAssessmentScore: number | null;
  latestProjectId: string | null;
  latestProjectTitle: string | null;
  latestFeedbackComment: string | null;
  latestAssessmentTitle: string | null;
};

export type CohortRecord = {
  id: string;
  title: string;
  description: string;
  programTitle: string | null;
  learnerCount: number;
};

export type TeacherStudentOptionRecord = {
  id: string;
  fullName: string;
  cohortId: string | null;
  cohortTitle: string | null;
};

export type InterestAssessmentRecord = {
  careerPreference: string | null;
  entertainmentPreference: string | null;
  workStyle: string | null;
  industryInterest: string | null;
  updatedAt: string | null;
};

export type SkillDiagnosticRecord = {
  reading: SkillBand | null;
  writing: SkillBand | null;
  math: SkillBand | null;
  history: SkillBand | null;
  logic: SkillBand | null;
  strengths: string[];
  weaknesses: string[];
  gradeLevelSummary: string;
  updatedAt: string | null;
};

export type PersonalizedProjectMilestoneRecord = {
  title: string;
  description: string;
};

export type PersonalizedProjectRubricRecord = {
  criterion: string;
  description: string;
};

export type PersonalizedProjectTimelineRecord = {
  label: string;
  goal: string;
};

export type PersonalizedProjectBriefRecord = {
  id: string;
  title: string;
  subject: string;
  description: string;
  teacherPriorities: string;
  focusStrengths: string[];
  focusWeaknesses: string[];
  skillsTargeted: string[];
  milestones: PersonalizedProjectMilestoneRecord[];
  rubric: PersonalizedProjectRubricRecord[];
  timeline: PersonalizedProjectTimelineRecord[];
  projectMode: "individual" | "group";
  targetLabel: string;
  studentIds: string[];
  groupName: string | null;
  status: "generated" | "edited";
  workspaceProjectId: string | null;
  workspaceProjectCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectTaskType = "checklist" | "submission";

export type ProjectWorkspaceMilestoneRecord = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  dueDate: string | null;
  completedTaskCount: number;
  taskCount: number;
};

export type ProjectWorkspaceTaskRecord = {
  id: string;
  milestoneId: string | null;
  title: string;
  description: string;
  taskType: ProjectTaskType;
  sortOrder: number;
  isRequired: boolean;
  dueDate: string | null;
  status: LessonTaskStatus;
  responseText: string | null;
  completedAt: string | null;
  latestSubmissionId: string | null;
  latestSubmissionText: string | null;
  latestFeedbackComment: string | null;
  latestFeedbackScore: number | null;
  latestFeedbackTeacher: string | null;
  files: SubmissionFileRecord[];
};

export type ProjectWorkspaceResourceRecord = {
  id: string;
  title: string;
  description: string;
  resourceType: "link" | "note";
  externalUrl: string | null;
  sortOrder: number;
};

export type ProjectWorkspaceSubmissionRecord = {
  id: string;
  submittedAt: string;
  status: ProjectStatus;
  submissionText: string;
  files: SubmissionFileRecord[];
  feedbackComment: string | null;
  feedbackScore: number | null;
  feedbackTeacher: string | null;
};

export type ProjectWorkspaceRecord = {
  id: string;
  studentId: string;
  studentName: string;
  generatedProjectId: string | null;
  experienceType: ProjectExperienceType;
  title: string;
  subject: string;
  description: string;
  studentMission: string | null;
  status: ProjectStatus;
  createdAt: string;
  personalizedBriefId: string | null;
  personalizedBriefTitle: string | null;
  personalizedReason: string | null;
  teacherPriorities: string | null;
  targetSkills: string[];
  rubric: PersonalizedProjectRubricRecord[];
  timeline: PersonalizedProjectTimelineRecord[];
  materials: string[];
  reflectionQuestions: string[];
  milestones: ProjectWorkspaceMilestoneRecord[];
  tasks: ProjectWorkspaceTaskRecord[];
  resources: ProjectWorkspaceResourceRecord[];
  submissions: ProjectWorkspaceSubmissionRecord[];
  reflectionNote: string | null;
  reflectionUpdatedAt: string | null;
  progressPercent: number;
  completedTaskCount: number;
  taskCount: number;
  accessRole: UserRole;
  accessLabel: string;
  canStudentEdit: boolean;
  canTeacherManage: boolean;
  isReadOnly: boolean;
};

export type IncompleteStudentAccountRecord = {
  id: string;
  email: string | null;
  fullName: string;
  issue: "missing_profile" | "missing_role";
};

export type TeacherAssignmentDirectoryRecord = {
  availableStudents: TeacherStudentOptionRecord[];
  alreadyAssignedStudents: TeacherStudentOptionRecord[];
  incompleteStudents: IncompleteStudentAccountRecord[];
  totalStudentAccountCount: number;
};

export type ProgramAccessRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  shopifyProductId: string | null;
  isActive: boolean;
  isEnrolled: boolean;
  accessSource: "direct" | "linked-child" | "none";
  enrollmentUserName: string | null;
};

export type EnrollmentRecord = {
  id: string;
  programTitle: string;
  programSlug: string;
  userId: string;
  userName: string | null;
  status: string;
  purchaseId: string | null;
  accessReason: string | null;
  grantedByAdminName: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type PurchaseRecord = {
  id: string;
  orderId: string;
  email: string | null;
  amountCents: number | null;
  currency: string | null;
  financialStatus: string;
  processingState: string;
  processingError: string | null;
  createdAt: string;
};

export type PendingProgramAccessRecord = {
  id: string;
  email: string;
  programTitle: string;
  status: string;
  purchaseId: string | null;
  resolvedByAdminName: string | null;
  resolutionNote: string | null;
  createdAt: string;
};

export type ProgramModuleRecord = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  lessons: ProgramLessonRecord[];
};

export type ProgramLessonRecord = {
  id: string;
  title: string;
  summary: string;
  content: string;
  sortOrder: number;
  estimatedMinutes: number;
  isPublished: boolean;
  status: "not_started" | "in_progress" | "completed";
  completedAt: string | null;
  reflectionNote: string | null;
  reflectionUpdatedAt: string | null;
  tasks: ProgramLessonTaskRecord[];
};

export type ProgramResourceRecord = {
  id: string;
  title: string;
  description: string;
  resourceType: "link" | "file";
  externalUrl: string | null;
  fileName: string | null;
  downloadUrl: string | null;
  lessonId: string | null;
  moduleId: string | null;
};

export type ProgramDeliveryRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  accessSource: "direct" | "linked-child" | "admin";
  accessLabel: string;
  progressPercent: number;
  lessonCount: number;
  completedLessonCount: number;
  modules: ProgramModuleRecord[];
  resources: ProgramResourceRecord[];
  canTrackProgress: boolean;
};

export type LessonTaskStatus = "not_started" | "in_progress" | "submitted" | "completed" | "needs_revision";

export type ProgramLessonTaskRecord = {
  id: string;
  title: string;
  instructions: string;
  taskType: "checkpoint" | "submission";
  sortOrder: number;
  isRequired: boolean;
  dueDate: string | null;
  status: LessonTaskStatus;
  responseText: string | null;
  submissionProjectId: string | null;
  latestSubmissionText: string | null;
  latestFeedbackComment: string | null;
  latestFeedbackScore: number | null;
  latestFeedbackTeacher: string | null;
  files: SubmissionFileRecord[];
};

export type EnrolledProgramSummaryRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  progressPercent: number;
  lessonCount: number;
  completedLessonCount: number;
  nextLessonTitle: string | null;
  accessLabel: string;
};

export type AdminProgramContentLessonRecord = {
  id: string;
  title: string;
  summary: string;
  content: string;
  sortOrder: number;
  estimatedMinutes: number;
  isPublished: boolean;
  tasks: AdminProgramLessonTaskRecord[];
};

export type AdminProgramLessonTaskRecord = {
  id: string;
  title: string;
  instructions: string;
  taskType: "checkpoint" | "submission";
  sortOrder: number;
  isRequired: boolean;
  dueDate: string | null;
};

export type AdminProgramContentModuleRecord = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  lessons: AdminProgramContentLessonRecord[];
};

export type AdminProgramContentResourceRecord = {
  id: string;
  title: string;
  description: string;
  resourceType: "link" | "file";
  externalUrl: string | null;
  fileName: string | null;
  bucket: string | null;
  storagePath: string | null;
  moduleId: string | null;
  lessonId: string | null;
  isPublished: boolean;
};

export type AdminProgramContentRecord = {
  id: string;
  title: string;
  slug: string;
  modules: AdminProgramContentModuleRecord[];
  resources: AdminProgramContentResourceRecord[];
};

export type TeacherProgramProgressRecord = {
  enrollmentId: string;
  programId: string;
  programTitle: string;
  programSlug: string;
  studentId: string;
  studentName: string;
  cohortTitle: string | null;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  latestReflectionLessonTitle: string | null;
  latestReflectionNote: string | null;
  pendingSubmissionTasks: number;
  needsRevisionTasks: number;
};

export type DeadlineState = "overdue" | "due_soon" | "upcoming" | "awaiting_feedback";

export type NotificationType =
  | "student_due_soon"
  | "student_overdue"
  | "teacher_pending_review"
  | "teacher_overdue_attention"
  | "parent_due_summary"
  | "parent_overdue_summary";

export type NotificationSeverity = "info" | "warning" | "success";

export type NotificationRecord = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actionHref: string | null;
  status: "unread" | "read";
  emailStatus: string;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
  severity: NotificationSeverity;
};

export type NotificationSettingRecord = {
  type: NotificationType;
  label: string;
  description: string;
  audience: UserRole;
  isEnabled: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  updatedAt: string;
};

export type NotificationPreferenceRecord = {
  type: NotificationType;
  label: string;
  description: string;
  audience: UserRole;
  globalEnabled: boolean;
  globalInAppEnabled: boolean;
  globalEmailEnabled: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
};

export type AdminNotificationHistoryRecord = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  role: UserRole;
  type: NotificationType;
  title: string;
  body: string;
  actionHref: string | null;
  status: "unread" | "read";
  emailStatus: string;
  emailError: string | null;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
};

export type NotificationRunRecord = {
  id: string;
  triggerSource: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  usersProcessed: number;
  notificationsCreated: number;
  emailsAttempted: number;
  emailsSent: number;
  emailsFailed: number;
  summary: string | null;
  errorMessage: string | null;
};

export type StudentTaskDeadlineRecord = {
  taskId: string;
  programTitle: string;
  programSlug: string;
  lessonTitle: string;
  taskTitle: string;
  taskType: "checkpoint" | "submission";
  dueDate: string | null;
  dueState: DeadlineState;
  status: LessonTaskStatus;
  latestFeedbackComment: string | null;
};

export type TeacherTriageRecord = {
  taskId: string;
  studentId: string;
  studentName: string;
  cohortTitle: string | null;
  programTitle: string;
  lessonTitle: string;
  taskTitle: string;
  taskType: "checkpoint" | "submission";
  dueDate: string | null;
  dueState: DeadlineState;
  status: LessonTaskStatus;
};

export type BrokenUserRecord = {
  id: string;
  email: string | null;
  fullName: string;
  authRole: UserRole | null;
  profileRole: UserRole | null;
  profileRoleSource: "explicit" | "fallback" | null;
  issue: "missing_profile" | "missing_role";
};
