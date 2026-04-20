# Universal Learner Platform

Premium education website plus role-based PBL platform built with Next.js, Tailwind, Supabase, and Shopify.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- Supabase Auth, Postgres, Storage
- Shopify integration for commerce and enrollment unlocks

## Getting started

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project.
3. In Supabase, enable Email auth and copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Run the SQL in [supabase/migrations/001_initial_platform.sql](C:\Users\bk911\OneDrive\Documents\New project\supabase\migrations\001_initial_platform.sql) in the Supabase SQL editor.
5. Confirm the `submissions` and `program-resources` storage buckets exist in Supabase Storage.
   The migration attempts to create them, but if your project restricts storage DDL in SQL, create them manually as private buckets named `submissions` and `program-resources`.
6. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local development.
7. Add Shopify values if you want commerce sync:
   - `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
   - `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`
   - `SHOPIFY_ADMIN_ACCESS_TOKEN`
   - `SHOPIFY_WEBHOOK_SECRET`
8. Add email provider values if you want reminder emails in addition to in-app notifications:
   - `EMAIL_PROVIDER=resend`
   - `EMAIL_FROM_ADDRESS`
   - `EMAIL_REPLY_TO` (optional)
   - `RESEND_API_KEY`
9. Add a reminder sync secret:
   - `NOTIFICATION_CRON_SECRET`
   - or `CRON_SECRET` if you are using Vercel cron
10. In Supabase, make sure every signed-up profile has an email stored in `profiles.email`.
   New signups do this automatically now. Older rows may need a one-time backfill.
11. In the `programs` table, set each program's `shopify_product_id` to the matching Shopify product id.
   Purchases only unlock access when the incoming Shopify product id matches a row in `programs`.
12. Install dependencies with `npm install`.
13. Start the app with `npm run dev`.
14. Verify production compilation with `npm run build`.

## What works now

- Premium public marketing site with homepage, methods, programs, testimonials, about, contact, consultation, login, and sign-up pages.
- Supabase auth server actions for sign-up and login.
- Protected `/app/*` routes via middleware plus role checks in each dashboard route.
- Role-aware auth callback that redirects to the correct dashboard.
- Real student workflow:
  - Student signs up as a `student`.
  - Student submits a project and first submission from `/app/student`.
  - Student can attach up to 3 files to the submission.
  - Project and submission are saved in Supabase.
- Real teacher workflow:
  - Teacher signs up as a `teacher`.
  - Teacher sees student submissions in `/app/teacher`.
  - Teacher can view and download uploaded submission files.
  - Teacher leaves scored feedback.
  - Feedback updates project and submission status.
- Student feedback visibility:
  - Student dashboard shows latest submission plus latest teacher feedback from Supabase.
- Real assessment workflow:
  - Teacher can create assessments for students.
  - Student can view assigned assessments.
  - Teacher can grade or delete assessments.
  - Student can see assessment scores and teacher comments.
- Parent-child visibility:
  - Parent can link a child account by the student's email address.
  - Parent dashboard shows linked child project count, submission count, feedback summary, and assessment summary.
- Program access and enrollment:
  - Authenticated users can browse `/app/programs` and see which programs are locked or unlocked.
  - Protected program detail pages live under `/app/programs/[slug]`.
  - Access is granted only when the user has an active enrollment or, for parents, when a linked child has one.
  - Student and parent dashboards reflect enrollment and purchase state.
- Program delivery:
  - Programs now support structured `program_modules`, `program_lessons`, `program_resources`, and `user_lesson_progress`.
  - `/app/programs/[slug]` renders a real protected learning experience with overview, module roadmap, lesson content, protected resources, and learner progress actions.
  - Directly enrolled students can mark lessons in progress or complete.
  - Parents can open the same program experience in linked-child visibility mode and see the learner's progress without mutating it.
- Lesson execution:
  - Lessons can now include `lesson_tasks` for checkpoints and lesson-linked submissions.
  - Students can save `lesson_reflections`, complete checkpoints, and submit lesson work with files directly inside the program.
  - Submission-style lesson work reuses the existing `projects`, `submissions`, `files`, and `feedback` workflow instead of creating a disconnected review system.
  - Teacher feedback on lesson-task submissions updates the learner's task and lesson progress state.
- Classroom orchestration:
  - Teachers can create cohorts and assign specific learners to their instructional scope.
  - Lesson tasks now support optional due dates.
  - Student dashboards surface due-soon, overdue, and awaiting-feedback lesson work.
  - Teacher dashboards support cohort-aware triage for overdue, due-soon, submitted, and revision-needed lesson tasks.
  - Parent dashboards show read-only upcoming deadlines for linked learners.
- Notifications and engagement automation:
  - Student due-soon and overdue reminders are generated from live lesson-task deadlines.
  - Teacher alerts summarize pending review work and overdue learner attention inside assigned classroom scope.
  - Parent dashboards show read-only due-soon and overdue summaries for linked children.
  - Notification records are stored in Supabase and surfaced in-app even when email delivery is not configured.
  - Background reminder sync can now run through the secured `/api/notifications/sync` endpoint without dashboard visits.
  - Users can configure per-account in-app and email notification preferences under the global admin reminder rules.
  - Notifications support read and dismiss/archive state plus unread counts in role dashboards.
  - Admin can enable or disable reminder types, inspect recent runs, and inspect recent notification history and delivery state.
- Role-aware onboarding:
  - Post-login and post-signup routing now considers claimed pending access, role, and active enrollments.
  - Newly claimed access routes users into `/app/onboarding`.
  - Students with one direct enrollment can land directly in their program.
  - Parents with accessible programs get a clearer onboarding screen that explains linked-child visibility.
- Purchase-to-enrollment flow:
  - Shopify webhook creates or updates a purchase record.
  - Matching Shopify product ids are mapped to `programs`.
  - If a platform user with the same email already exists, active enrollments are granted immediately.
  - If no matching user exists, pending access rows are stored and claimed later when that email signs up or logs in.
- Admin commerce operations:
  - Admin can create and edit programs, including slug, visibility, pricing, and `shopify_product_id` mapping.
  - Admin can manually grant or revoke enrollments.
  - Admin can inspect purchases, filter by `processing_state`, and retry processing safely.
  - Admin can manually resolve `pending_program_access` rows and assign them to the intended user or child account.
- Admin content operations:
  - Admin can create and edit program modules.
  - Admin can create and edit lessons with publish state, estimated duration, and lesson content.
  - Admin can create and edit lesson tasks for checkpoint and submission work.
  - Admin can upload protected program resources or attach link-based resources to a whole program, module, or lesson.
- Teacher program execution visibility:
  - Teacher dashboard now shows enrolled learner progress inside programs.
  - Teachers can review lesson progress, latest reflections, and lesson-task workload needing attention.
  - Lesson-linked submissions appear in the same teacher submission queue with program context labels.
- Parent and admin dashboards now read live Supabase-backed data instead of only placeholder data.
- Basic loading, empty, and error states for the authenticated app.

## Local development notes

- `npm install` works.
- `npm run build` now validates required env vars before the Next.js build starts.
- `npm run dev` works, but in this environment I had to start it outside the sandbox because Windows sandboxing blocked child-process spawning with `EPERM`.
- If your local machine does not have that restriction, `npm run dev` should work normally from a regular terminal.

## Production deployment steps

1. Create the production Supabase project.
2. Run the full SQL migration from [supabase/migrations/001_initial_platform.sql](C:\Users\bk911\OneDrive\Documents\New project\supabase\migrations\001_initial_platform.sql).
3. Create or confirm the private `submissions` and `program-resources` storage buckets.
4. Configure the required production env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
5. Configure optional but recommended env vars for the features you want live:
   - Shopify webhook and storefront vars
   - email delivery vars
   - reminder cron secret
6. Run `npm run validate:env`.
7. Run `npm run test`.
8. Run `npm run build`.
9. Deploy the app.
10. After deployment, verify:
   - login works
   - `/app/*` redirects correctly when signed out
   - Shopify webhook reaches `/api/shopify/webhooks`
   - reminder cron reaches `/api/notifications/sync`

## Staging rollout checklist

1. Set all required staging env vars.
2. Run the Supabase migration in the staging project.
3. Confirm private storage buckets exist.
4. Configure Shopify webhook secret and staging product mappings if commerce is being tested.
5. Configure `NOTIFICATION_CRON_SECRET` or `CRON_SECRET`.
6. Configure Resend env vars if email is being tested.
7. Run `npm run validate:env`.
8. Run `npm run typecheck`.
9. Run `npm run test`.
10. Run `npm run build`.
11. Deploy to staging.
12. Check `GET /api/health`.
13. Run the role-by-role smoke checklist.
14. Run the live integration checklist.

## Prelaunch verification checklist

### Supabase

- Migration applied successfully with no missing tables or policies.
- Email auth is enabled.
- `profiles.email` is populated for real users.
- `/api/health` returns `200` in the staging environment.

### RLS

- Student cannot see another student’s projects, submissions, feedback, or lesson progress.
- Parent can only see linked-child data.
- Teacher visibility is limited to intended classroom scope in staging data.
- Admin can reach all management surfaces.

### Storage buckets

- `submissions` exists and is private.
- `program-resources` exists and is private.
- Student uploads succeed.
- Teacher signed download links work.

### Shopify webhook

- `SHOPIFY_WEBHOOK_SECRET` is set.
- Shopify webhook points to `/api/shopify/webhooks`.
- A test order creates a `purchases` row.
- A mapped product grants enrollment or pending access as expected.

### Cron sync

- `NOTIFICATION_CRON_SECRET` or `CRON_SECRET` is set.
- Scheduler can call `/api/notifications/sync`.
- A `notification_runs` row appears after the scheduled call.
- Admin reminder run history updates correctly.

### Resend / email

- `EMAIL_PROVIDER`, `EMAIL_FROM_ADDRESS`, and `RESEND_API_KEY` are set if email is going live.
- Reminder sync produces `email_status = sent` for at least one test notification.
- If email is intentionally not configured, reminders still appear in-app and are marked `skipped` safely.

### Auth flows by role

- Student sign-up and login land in the correct dashboard/program context.
- Teacher sign-up and login land on `/app/teacher`.
- Parent sign-up and login land on `/app/parent`.
- Admin sign-in lands on `/app/admin`.
- Pending access claim on sign-up/login routes through onboarding correctly.

## Live integration verification checklist

### `/api/health`

- Returns `200`.
- `ok` is `true`.
- No required env vars are listed as missing.

### Supabase

- Auth works for all intended roles.
- New rows can be written for projects, submissions, feedback, purchases, and notifications.
- Admin dashboard loads summary counts successfully.

### Storage buckets

- Student upload to `submissions` succeeds.
- Teacher can download uploaded submission files.
- Program resources load correctly from `program-resources`.

### Shopify webhook

- A real or test order hits `/api/shopify/webhooks`.
- A `purchases` row appears.
- Processing state is correct: `enrolled`, `pending_account`, or another explicit safe state.

### Cron notifications sync

- Scheduled or manual call to `/api/notifications/sync` succeeds.
- A new `notification_runs` row appears.
- Admin reminder run history shows the latest run.

### Resend email

- If configured, at least one reminder reaches `email_status = sent`.
- If not configured, reminders still appear in-app and are safely marked `skipped`.

## Supabase setup checklist

- Enable Email auth.
- Apply the migration SQL.
- Confirm `profiles.email` is populated for real users.
- Confirm the `submissions` bucket exists and is private.
- Confirm the `program-resources` bucket exists and is private.
- Confirm RLS is enabled on the new tables, especially notification and access tables.

## Cron setup checklist

- Set `NOTIFICATION_CRON_SECRET` or `CRON_SECRET`.
- Point your scheduler at `/api/notifications/sync`.
- Send the secret as `Authorization: Bearer <secret>` or `x-notification-cron-secret`.
- Confirm a new row appears in `notification_runs`.
- Confirm admin reminder run history updates after the scheduled call.

## Email setup checklist

- Set `EMAIL_PROVIDER=resend`.
- Set `EMAIL_FROM_ADDRESS`.
- Set `RESEND_API_KEY`.
- Optionally set `EMAIL_REPLY_TO`.
- Run reminder sync and confirm `email_status` moves from `queued` to `sent` or `skipped`.

## Test commands

- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run validate:env`
- `npm run build`

## Role-by-role smoke plan

### Student

1. Sign up or log in as a student.
2. Confirm `/app/student` loads and protected routes are accessible.
3. Submit a project.
4. Upload at least one file.
5. Open an enrolled program and complete lesson work.
6. Confirm reminders appear or stay empty appropriately.

### Teacher

1. Sign in as a teacher.
2. Confirm assigned learners and cohorts are visible.
3. Review a student submission and leave feedback.
4. Create and grade an assessment.
5. Confirm triage, alerts, and program progress surfaces load.

### Parent

1. Sign in as a parent.
2. Link a child account.
3. Confirm linked-child progress, deadlines, and program visibility load in read-only mode.
4. Confirm family reminders appear or stay empty appropriately.

### Admin

1. Sign in as an admin.
2. Confirm deployment readiness section loads.
3. Confirm reminder settings, reminder runs, and notification history load.
4. Confirm purchase reconciliation and pending access management load.
5. Confirm program mapping and enrollment management still work.

## Immediate post-deploy tests

1. `GET /api/health`
2. Sign out and open `/app/student`
3. Student login and dashboard load
4. Teacher login and submission review load
5. Parent login and linked-child visibility load
6. Admin login and deployment readiness panel load
7. Manual reminder sync from admin
8. Test Shopify webhook delivery

## Current data model

- `roles`
- `profiles`
- `programs`
- `projects`
- `submissions`
- `feedback`
- `assessments`
- `enrollments`
- `purchases`
- `pending_program_access`
- `files`
- `parent_student_links`
- `program_modules`
- `program_lessons`
- `program_resources`
- `user_lesson_progress`
- `lesson_tasks`
- `lesson_reflections`
- `lesson_task_progress`
- `cohorts`
- `teacher_student_assignments`
- `notification_settings`
- `notifications`
- `notification_user_preferences`
- `notification_runs`

## Program content structure

- `programs` is the top-level commercial and access-controlled entity.
- `program_modules` groups a program into navigable sections.
- `program_lessons` belongs to a module and stores the full protected lesson content learners see in-app.
- `lesson_tasks` belongs to a lesson and defines checkpoint or submission work inside the lesson.
- `cohorts` groups learners under a teacher, optionally around a specific program.
- `teacher_student_assignments` ties teachers to specific learners and optionally to a cohort.
- `program_resources` can be attached at the program, module, or lesson level.
- `user_lesson_progress` stores learner-specific progress so students can resume and parents can monitor linked-child completion.
- `lesson_reflections` stores learner notes for each lesson.
- `lesson_task_progress` stores task state and, for submission tasks, points back to the reused project/submission pipeline through `project_id`.

## Lesson execution workflow

1. Admin creates a lesson and adds one or more lesson tasks.
2. Student opens the protected program lesson.
3. Student can save a reflection, complete a checkpoint, or submit a lesson task with files.
4. Submission-style lesson work creates or reuses a contextual project and then writes a normal submission plus file records.
5. Teacher reviews that work in the existing submission queue and leaves feedback there.
6. Teacher feedback updates the linked lesson task and lesson progress state.
7. Parent can view lesson progress, task state, and reflections in read-only mode through linked-child access.

## Classroom orchestration workflow

1. Teacher creates a cohort and optionally links it to a program.
2. Teacher assigns learners to that cohort or directly to their instructional scope.
3. Admin or teacher adds due dates to lesson tasks.
4. Student dashboard shows due-soon, overdue, and awaiting-feedback work.
5. Teacher dashboard filters triage by learner, cohort, program, task type, due state, and review state.
6. Parent dashboard shows upcoming deadlines and overdue work for linked learners in read-only form.

## Reminder workflow

1. Background sync or the admin reminder sync action evaluates live due-state, cohort, assignment, and linked-child data.
2. The app creates idempotent `notifications` rows for active reminder types in `notification_settings`.
3. `notification_user_preferences` applies per-account in-app and email overrides beneath the global admin reminder toggles.
4. Student reminders cover due-soon and overdue lesson work.
5. Teacher alerts cover pending review work and overdue learner attention inside assigned scope.
6. Parent summaries cover due-soon and overdue work for linked children in read-only form.
7. If email is enabled for that reminder type and a provider is configured, the app attempts delivery and stores `email_status` plus any `email_error`.
8. Notifications remain available in-app unless the user disables that in-app channel.
9. Users can mark reminders as read or dismiss/archive them from their dashboard.
10. Every background or manual run is stored in `notification_runs` for admin visibility.

## Program onboarding behavior

- If a pending purchase is claimed during sign-in or sign-up, the user is routed to `/app/onboarding`.
- If a student has exactly one direct enrollment and did not just claim new access, they can be sent directly into that program.
- If a student has multiple programs, onboarding highlights available programs and their next lesson.
- If a parent has linked-child access, onboarding explains that visibility comes through the child account and points them to the right program and parent dashboard surfaces.
- Teachers and admins bypass onboarding and go directly to their operational dashboards.

## Shopify webhook behavior

- `/api/shopify/webhooks` verifies the webhook signature.
- It creates or updates a `purchases` record with `processing_state` and `processing_error`.
- It matches Shopify product ids to `programs.shopify_product_id`.
- If no program matches, the purchase is stored safely with an explicit unmapped state.
- If no purchase email is present, the purchase is stored safely with an explicit missing-email state.
- If a matching platform user exists by email, active `enrollments` are granted immediately.
- If no matching platform user exists, `pending_program_access` rows are created so access can be claimed later.
- If only some products on the order map to platform programs, the purchase is marked as partially enrolled.

## Shopify storefront content sync

- The public marketing site now pulls products, collections, and blog articles directly from the Shopify Storefront API.
- Next.js caches those responses with tags and a 5-minute revalidation window so pages stay fast.
- The homepage, `/programs`, and `/insights` update automatically from Shopify once the storefront token is configured.
- If Storefront credentials are missing, the site falls back safely for product cards and shows empty states for collections and articles.
- Register these Shopify content webhooks to invalidate cached pages immediately after content changes:
  - `products/create`
  - `products/update`
  - `products/delete`
  - `collections/create`
  - `collections/update`
  - `collections/delete`
  - `articles/create`
  - `articles/update`
  - `articles/delete`
  - `blogs/update`

## Shopify setup checklist

1. In Shopify, identify the product ids for the programs that should unlock platform access.
2. In Supabase, update `programs.shopify_product_id` to those exact Shopify product ids.
3. Expose your deployment URL publicly and register a Shopify webhook pointing to:
   - `POST https://your-domain.com/api/shopify/webhooks`
4. Configure the webhook secret in `SHOPIFY_WEBHOOK_SECRET`.
5. Configure `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` with Storefront API access for:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_content`
6. Optional: set `SHOPIFY_STOREFRONT_API_VERSION` if you want to pin a specific Storefront API version.
7. Send order events for the purchased products you want to unlock.
8. Send product, collection, and article webhooks to keep the cached custom site fresh immediately after Shopify updates.

## Product mapping workflow

1. Open the admin dashboard.
2. Use the program management section to create or edit platform programs.
3. Paste the exact Shopify product id into the `shopify_product_id` field for the matching platform program.
4. Keep the slug stable once the protected program route is in use.
5. If a purchase lands as `unmapped_product` or `partially_enrolled`, fix the mapping and use the admin retry action on the purchase.

## Onboarding behavior for unmatched purchase emails

- If a Shopify purchase email does not match any existing `profiles.email`, the system does not discard the purchase.
- It stores the purchase and creates `pending_program_access` rows for the mapped programs.
- When a user later signs up or logs in with that same email, pending access is automatically claimed and converted into active enrollments.
- Recommended path:
  - Encourage customers to create their platform account with the same email used at checkout.
  - If a customer used the wrong email at checkout, correct the email or manually reassign access in Supabase/admin tooling.

## Resolving unmatched purchases in admin

1. Open the admin dashboard.
2. Find the purchase under purchase reconciliation or the row under pending access management.
3. If the buyer now has an account, assign the pending access to that user.
4. If the purchase was made by a parent for a child, assign the pending access directly to the student's user account.
5. Add a clear resolution note so the access path is audit-friendly.
6. If the root issue was missing product mapping rather than missing user identity, fix the mapping and retry the purchase instead.

## Parent purchases intended for children

1. Let the Shopify purchase sync into the platform normally.
2. If the checkout email matches the parent's account, the purchase can still be visible on the parent dashboard.
3. If access should belong to the student, use the admin pending-access assignment or enrollment tools to grant the program to the child account.
4. Once the child has the active enrollment and is linked to the parent, the parent will still see the program through linked-child access while progress stays attached to the learner account.

## Reminder configuration and email setup

1. Run the latest SQL migration so `notification_settings` and `notifications` exist.
2. Open the admin dashboard and use Reminder operations to enable or disable reminder types.
3. If you want email delivery, set:
   - `EMAIL_PROVIDER=resend`
   - `EMAIL_FROM_ADDRESS`
   - `RESEND_API_KEY`
   - `EMAIL_REPLY_TO` (optional)
4. If email is not configured, the platform safely falls back to in-app notifications only.
5. Users can still opt out of in-app and email reminder channels per reminder type from their own dashboard.
6. Use the admin reminder sync action to generate reminders across current users and inspect delivery history.

## Background reminder sync

1. The project includes a secured reminder endpoint at:
   - `GET /api/notifications/sync`
   - `POST /api/notifications/sync`
2. The caller must send either:
   - `Authorization: Bearer <NOTIFICATION_CRON_SECRET>`
   - or `x-notification-cron-secret: <NOTIFICATION_CRON_SECRET>`
3. If you deploy on Vercel, `vercel.json` already includes an hourly cron for `/api/notifications/sync`.
4. On Vercel you can set either:
   - `CRON_SECRET`
   - or `NOTIFICATION_CRON_SECRET`
5. If you use another scheduler or worker platform, call the same endpoint on your preferred cadence.
6. Admin can inspect `notification_runs` from the admin dashboard to verify last sync time and outcomes.

## Seed data suggestions

- Create one student account, one teacher account, and one parent account through the app.
- Sign in as the student and submit a project with at least one file attached.
- Sign in as the teacher and leave feedback.
- Sign in as the teacher and create then grade an assessment for the same student.
- Sign in as the parent and link the student using the student's signup email.
- Update at least one `programs.shopify_product_id` value to a real Shopify product id.
- Trigger a Shopify order webhook for that product.
- Return to the student and parent dashboards to confirm the feedback and assessment loops.
- Add at least one module, one lesson, and one protected resource to a program from the admin dashboard.
- Add at least one lesson task to a lesson and complete it as a student.
- Create a cohort, assign a learner, and add a due date to at least one lesson task.
- Enroll the student into that program and confirm the learner can complete lessons and see progress reflected in onboarding and dashboards.
- Run reminder sync from the admin dashboard and confirm student, teacher, and parent reminders appear.
- Configure the cron secret and confirm `/api/notifications/sync` can generate reminders without opening any dashboards.

## Remaining external setup

- Real Supabase project and env vars.
- Shopify product ids mapped into the `programs` table.
- Shopify webhook registration for `/api/shopify/webhooks`.
- Private `submissions` storage bucket if SQL-based bucket creation is unavailable in your Supabase project.
- Private `program-resources` storage bucket if SQL-based bucket creation is unavailable in your Supabase project.
- Optional avatar bucket if you later add profile image uploads.
- Optional email provider env vars if you want reminder emails instead of in-app only.
- Cron or worker configuration plus `NOTIFICATION_CRON_SECRET` or `CRON_SECRET` for automatic reminder delivery.
- Parent-child linking uses the student's auth email, so each student needs a real account in Supabase Auth.
- Older profile rows may need an `email` backfill if they were created before the `profiles.email` field was added.
- Existing databases will need the updated migration fields for audit metadata on programs, enrollments, and pending access.
