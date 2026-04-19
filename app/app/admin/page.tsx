import { EnrollmentGrantForm } from "@/components/admin/enrollment-grant-form";
import { EnrollmentRevokeForm } from "@/components/admin/enrollment-revoke-form";
import { NotificationRetryForm } from "@/components/admin/notification-retry-form";
import { NotificationSettingForm } from "@/components/admin/notification-setting-form";
import { NotificationSyncForm } from "@/components/admin/notification-sync-form";
import { PendingAccessAssignForm } from "@/components/admin/pending-access-assign-form";
import { ProgramLessonForm } from "@/components/admin/program-lesson-form";
import { ProgramModuleForm } from "@/components/admin/program-module-form";
import { ProgramResourceForm } from "@/components/admin/program-resource-form";
import { ProgramTaskForm } from "@/components/admin/program-task-form";
import { ProgramEditorForm } from "@/components/admin/program-editor-form";
import { PurchaseRetryForm } from "@/components/admin/purchase-retry-form";
import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, EmptyState, MetricCard } from "@/components/dashboard/dashboard-primitives";
import { assertRole } from "@/lib/auth/roles";
import { getDeploymentReadiness } from "@/lib/config/readiness";
import {
  getAdminCommerceOverview,
  getAdminNotificationOverview,
  getAdminProgramContentOverview,
  getAdminPurchasesByState,
  getAdminSummary,
  getProfileForCurrentUser
} from "@/lib/dashboard/queries";
import { formatDate } from "@/lib/format";

function formatMoney(amountCents: number | null, currency: string | null) {
  if (amountCents === null) {
    return "Unknown amount";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD"
  }).format(amountCents / 100);
}

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ processing_state?: string }>;
}) {
  const { profile } = await getProfileForCurrentUser();
  assertRole(["admin"], profile?.role ?? null);

  const params = await searchParams;
  const purchaseStateFilter = params.processing_state ?? "all";

  const [summary, commerce, filteredPurchases, notificationOverview] = await Promise.all([
    getAdminSummary(),
    getAdminCommerceOverview(),
    getAdminPurchasesByState(purchaseStateFilter),
    getAdminNotificationOverview()
  ]);
  const contentOverview = await getAdminProgramContentOverview();
  const readiness = getDeploymentReadiness();

  const userOptions = commerce.users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    role: user.role
  }));
  const programOptions = commerce.programs.map((program) => ({
    id: program.id,
    title: program.title
  }));

  return (
    <AppShell
      role="admin"
      title="Admin dashboard"
      description="Admins can now manage program mappings, enrollments, purchases, and pending-access reconciliation from one operational workspace."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Users" value={String(summary.userCount)} detail="Counted from the profiles table." />
        <MetricCard label="Projects" value={String(summary.projectCount)} detail="Live total across student submissions." />
        <MetricCard label="Purchases" value={String(summary.purchaseCount)} detail="Webhook-ingested commerce events." />
      </section>

      <DashboardSection
        title="Deployment readiness"
        description="This surfaces environment-backed launch assumptions so staging and production setup issues are obvious before rollout."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-500">Core app</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{readiness.features.coreAppReady ? "Ready" : "Blocked"}</p>
            <p className="mt-2 text-sm text-slate-600">Required runtime env vars for app boot and server actions.</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-500">Shopify</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{readiness.features.shopifyReady ? "Ready" : "Partial"}</p>
            <p className="mt-2 text-sm text-slate-600">Webhook verification and product unlock integration readiness.</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-500">Cron</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{readiness.features.cronReady ? "Ready" : "Missing"}</p>
            <p className="mt-2 text-sm text-slate-600">Background reminder sync secret and scheduler dependency.</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-500">Email</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{readiness.features.emailReady ? "Ready" : "Optional"}</p>
            <p className="mt-2 text-sm text-slate-600">Resend-backed delivery remains optional because in-app notifications still work.</p>
          </div>
        </div>

        {readiness.missingRequired.length > 0 ? (
          <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-lg font-semibold text-amber-900">Launch-blocking configuration is missing</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {readiness.missingRequired.map((check) => (
                <div key={check.key} className="rounded-2xl bg-white px-4 py-3 text-sm text-amber-900">
                  {check.label} <span className="text-amber-700">({check.key})</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
            Required deployment env vars are configured for this runtime context.
          </div>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-ink">Operational endpoints</h3>
            <p className="mt-3 text-sm text-slate-600">Use these during staging rollout to validate the runtime without clicking through every workflow first.</p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>/api/health</p>
              <p>/api/notifications/sync</p>
              <p>/api/shopify/webhooks</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-ink">Staging notes</h3>
            <p className="mt-3 text-sm text-slate-600">Run `npm run validate:env`, then `npm run test`, then check `/api/health` before moving into live role verification.</p>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Create a program"
        description="Create new programs or keep Shopify product mappings accurate so purchases unlock the correct in-app access."
      >
        <ProgramEditorForm />
      </DashboardSection>

      <DashboardSection
        title="Reminder operations"
        description="Notification settings, reminder sync, and delivery history keep the engagement layer operational instead of ad hoc."
      >
        <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
          <NotificationSyncForm />
          <div className="space-y-4">
            {notificationOverview.settings.length === 0 ? (
              <EmptyState title="No reminder settings found" description="Run the latest migration and reminder sync to seed notification settings." />
            ) : (
              notificationOverview.settings.map((setting) => <NotificationSettingForm key={setting.type} setting={setting} />)
            )}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Reminder run history"
        description="Background and manual reminder runs record their last sync time, delivery totals, and any failures for admin visibility."
      >
        {notificationOverview.runs.length === 0 ? (
          <EmptyState title="No reminder runs recorded yet" description="Run reminder sync manually or configure the cron endpoint to start building run history." />
        ) : (
          <div className="space-y-4">
            {notificationOverview.runs.map((run) => (
              <article key={run.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{run.triggerSource}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {run.status} | Started {formatDate(run.startedAt)}{run.completedAt ? ` | Completed ${formatDate(run.completedAt)}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {run.notificationsCreated} notification{run.notificationsCreated === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">Users processed: {run.usersProcessed}</div>
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">Emails attempted: {run.emailsAttempted}</div>
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">Emails sent: {run.emailsSent}</div>
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">Emails failed: {run.emailsFailed}</div>
                </div>
                {run.summary ? <p className="mt-4 text-sm text-slate-600">{run.summary}</p> : null}
                {run.errorMessage ? <p className="mt-3 text-sm text-amber-700">{run.errorMessage}</p> : null}
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Program management"
        description="Edit title, slug, description, visibility, pricing, and Shopify product mapping for each platform program."
      >
        {commerce.programs.length === 0 ? (
          <EmptyState
            title="No programs configured"
            description="Create the first program above and map it to a Shopify product when ready."
          />
        ) : (
          <div className="space-y-5">
            {commerce.programs.map((program) => (
              <article key={program.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">{program.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      /{program.slug} | {program.isActive ? "Visible" : "Hidden"} | Updated {formatDate(program.updatedAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Shopify product: {program.shopifyProductId ?? "Unmapped"}
                  </span>
                </div>
                <ProgramEditorForm program={program} />
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Program content management"
        description="Create and edit modules, lessons, and protected resources so enrollment unlocks real curriculum rather than a generic gated page."
      >
        {contentOverview.length === 0 ? (
          <EmptyState
            title="No programs ready for content yet"
            description="Create a program first, then use this section to build its delivery structure."
          />
        ) : (
          <div className="space-y-6">
            {contentOverview.map((program) => (
              <article key={program.id} className="rounded-[1.75rem] border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-semibold text-ink">{program.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      /{program.slug} | {program.modules.length} module{program.modules.length === 1 ? "" : "s"} | {program.resources.length} resource
                      {program.resources.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <ProgramModuleForm programId={program.id} />
                  <ProgramResourceForm
                    programId={program.id}
                    modules={program.modules.map((module) => ({
                      id: module.id,
                      title: module.title,
                      lessons: module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title }))
                    }))}
                  />
                </div>

                <div className="mt-6 space-y-5">
                  {program.modules.length === 0 ? (
                    <EmptyState
                      title="No modules created yet"
                      description="Start by creating a module, then add lessons and attach resources."
                    />
                  ) : (
                    program.modules.map((module) => (
                      <div key={module.id} className="rounded-[1.5rem] bg-slate-50 p-5">
                        <div className="mb-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Module</p>
                          <h4 className="mt-2 text-xl font-semibold text-ink">{module.title}</h4>
                          <p className="mt-2 text-sm text-slate-600">{module.description}</p>
                        </div>

                        <ProgramModuleForm programId={program.id} module={module} />

                        <div className="mt-4 space-y-4">
                          <ProgramLessonForm programId={program.id} moduleId={module.id} />
                          {module.lessons.length === 0 ? (
                            <p className="text-sm text-slate-500">No lessons added to this module yet.</p>
                          ) : (
                            module.lessons.map((lesson) => (
                              <div key={lesson.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <h5 className="text-lg font-semibold text-ink">{lesson.title}</h5>
                                    <p className="mt-1 text-sm text-slate-600">
                                      {lesson.summary} | {lesson.estimatedMinutes} min | {lesson.isPublished ? "Published" : "Draft"}
                                    </p>
                                  </div>
                                </div>
                                <ProgramLessonForm programId={program.id} moduleId={module.id} lesson={lesson} />
                                <div className="mt-4 space-y-3">
                                  <ProgramTaskForm lessonId={lesson.id} />
                                  {lesson.tasks.length === 0 ? (
                                    <p className="text-sm text-slate-500">No lesson tasks created yet.</p>
                                  ) : (
                                    lesson.tasks.map((task) => (
                                      <div key={task.id} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-sm font-semibold text-ink">
                                          {task.title} | {task.taskType} | {task.isRequired ? "Required" : "Optional"}
                                        </p>
                                        <p className="mt-2 text-sm text-slate-600">{task.instructions}</p>
                                        <div className="mt-3">
                                          <ProgramTaskForm lessonId={lesson.id} task={task} />
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  <h4 className="text-lg font-semibold text-ink">Existing resources</h4>
                  {program.resources.length === 0 ? (
                    <p className="text-sm text-slate-500">No resources attached to this program yet.</p>
                  ) : (
                    program.resources.map((resource) => (
                      <div key={resource.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                        <div className="mb-3">
                          <p className="text-lg font-semibold text-ink">{resource.title}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {resource.resourceType === "file" ? resource.fileName ?? "Protected file" : resource.externalUrl ?? "Link resource"} |{" "}
                            {resource.isPublished ? "Published" : "Draft"}
                          </p>
                        </div>
                        <ProgramResourceForm
                          programId={program.id}
                          modules={program.modules.map((module) => ({
                            id: module.id,
                            title: module.title,
                            lessons: module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title }))
                          }))}
                          resource={resource}
                        />
                      </div>
                    ))
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Manual enrollment grant"
        description="Grant direct program access for support cases, migrations, or manual corrections."
      >
        {programOptions.length === 0 || userOptions.length === 0 ? (
          <EmptyState
            title="Programs and users are required"
            description="You need at least one program and one user before manual enrollment can be granted."
          />
        ) : (
          <EnrollmentGrantForm programs={programOptions} users={userOptions} />
        )}
      </DashboardSection>

      <DashboardSection
        title="Enrollment management"
        description="Inspect active and revoked enrollments, see why access exists, and revoke access when needed."
      >
        {commerce.enrollments.length === 0 ? (
          <EmptyState
            title="No enrollments yet"
            description="Enrollments will appear here after webhook processing or manual grants."
          />
        ) : (
          <div className="space-y-4">
            {commerce.enrollments.map((enrollment) => (
              <article key={enrollment.id} className="grid gap-4 rounded-[1.5rem] border border-slate-200 p-5 xl:grid-cols-[1fr,0.95fr]">
                <div>
                  <h3 className="text-lg font-semibold text-ink">{enrollment.programTitle}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {enrollment.userName} | {enrollment.status}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Access source: {enrollment.purchaseId ? `purchase ${enrollment.purchaseId}` : "manual/admin"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Reason: {enrollment.accessReason ?? "No explicit reason stored."}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Granted by: {enrollment.grantedByAdminName ?? "System"} | Created {formatDate(enrollment.createdAt)}
                  </p>
                  {enrollment.revokedAt ? (
                    <p className="mt-2 text-sm text-amber-700">Revoked on {formatDate(enrollment.revokedAt)}</p>
                  ) : null}
                </div>
                {enrollment.status === "active" ? (
                  <EnrollmentRevokeForm enrollmentId={enrollment.id} />
                ) : (
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">This enrollment has already been revoked.</div>
                )}
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Purchase reconciliation"
        description="Filter recent purchases by processing state, inspect errors, and retry safe webhook processing after fixing mappings or account issues."
      >
        <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Processing state</label>
            <select
              name="processing_state"
              defaultValue={purchaseStateFilter}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
            >
              <option value="all">All</option>
              <option value="received">Received</option>
              <option value="enrolled">Enrolled</option>
              <option value="partially_enrolled">Partially enrolled</option>
              <option value="pending_account">Pending account</option>
              <option value="resolved_manually">Resolved manually</option>
              <option value="unmapped_product">Unmapped product</option>
              <option value="missing_email">Missing email</option>
              <option value="program_lookup_failed">Program lookup failed</option>
              <option value="enrollment_failed">Enrollment failed</option>
              <option value="pending_access_failed">Pending access failed</option>
              <option value="no_line_items">No line items</option>
            </select>
          </div>
          <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
            Apply filter
          </button>
        </form>

        {filteredPurchases.length === 0 ? (
          <EmptyState
            title="No purchases match this filter"
            description="Try another processing state or wait for Shopify webhook events to arrive."
          />
        ) : (
          <div className="space-y-4">
            {filteredPurchases.map((purchase) => {
              const matchingEnrollmentCount = commerce.enrollments.filter((enrollment) => enrollment.purchaseId === purchase.id).length;
              const matchingPendingCount = commerce.pendingAccess.filter((entry) => entry.purchaseId === purchase.id).length;

              return (
                <article key={purchase.id} className="grid gap-4 rounded-[1.5rem] border border-slate-200 p-5 xl:grid-cols-[1fr,0.9fr]">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">Order {purchase.orderId}</h3>
                    <p className="mt-2 text-sm text-slate-600">{purchase.email ?? "No email attached"}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {purchase.processingState} | {purchase.financialStatus} | {formatMoney(purchase.amountCents, purchase.currency)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Resulted in {matchingEnrollmentCount} enrollment{matchingEnrollmentCount === 1 ? "" : "s"} and {matchingPendingCount} pending access row{matchingPendingCount === 1 ? "" : "s"}.
                    </p>
                    {purchase.processingError ? <p className="mt-3 text-sm text-amber-700">{purchase.processingError}</p> : null}
                  </div>
                  <PurchaseRetryForm purchaseId={purchase.id} />
                </article>
              );
            })}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Pending access management"
        description="Reassign unmatched purchases to a real user account, including parent purchases that should grant access to the intended child."
      >
        {commerce.pendingAccess.length === 0 ? (
          <EmptyState
            title="No pending access rows"
            description="If a purchase email has no matching platform account, the access will appear here for admin resolution."
          />
        ) : (
          <div className="space-y-4">
            {commerce.pendingAccess.map((entry) => (
              <article key={entry.id} className="grid gap-4 rounded-[1.5rem] border border-slate-200 p-5 xl:grid-cols-[1fr,0.95fr]">
                <div>
                  <h3 className="text-lg font-semibold text-ink">{entry.programTitle}</h3>
                  <p className="mt-2 text-sm text-slate-600">{entry.email}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {entry.status} | Purchase {entry.purchaseId ?? "none"} | Created {formatDate(entry.createdAt)}
                  </p>
                  {entry.resolvedByAdminName ? (
                    <p className="mt-2 text-sm text-slate-600">
                      Resolved by {entry.resolvedByAdminName}: {entry.resolutionNote ?? "No note"}
                    </p>
                  ) : null}
                </div>
                {entry.status === "pending" ? (
                  <PendingAccessAssignForm pendingId={entry.id} users={userOptions} />
                ) : (
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">This pending access row has already been resolved.</div>
                )}
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Notification history"
        description="Inspect generated reminder records, email delivery state, and retry delivery safely after fixing provider or recipient issues."
      >
        {notificationOverview.history.length === 0 ? (
          <EmptyState title="No reminders generated yet" description="Run reminder sync or open user dashboards to generate the first notification records." />
        ) : (
          <div className="space-y-4">
            {notificationOverview.history.map((notification) => (
              <article key={notification.id} className="grid gap-4 rounded-[1.5rem] border border-slate-200 p-5 xl:grid-cols-[1fr,0.9fr]">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-ink">{notification.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {notification.userName} | {notification.role} | {notification.type.replaceAll("_", " ")}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{notification.emailStatus}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{notification.body}</p>
                  <p className="mt-3 text-sm text-slate-500">
                    {notification.userEmail ?? "No email on file"} | Created {formatDate(notification.createdAt)}
                  </p>
                  {notification.emailError ? <p className="mt-2 text-sm text-amber-700">{notification.emailError}</p> : null}
                </div>
                {["failed", "queued", "skipped"].includes(notification.emailStatus) ? (
                  <NotificationRetryForm notificationId={notification.id} />
                ) : (
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">Delivery does not need a retry right now.</div>
                )}
              </article>
            ))}
          </div>
        )}
      </DashboardSection>
    </AppShell>
  );
}
