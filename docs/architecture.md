# Universal Learner Platform Architecture

## Reference analysis

### Source 1: PBL prototype
- Strengths: rich dashboard behavior, clear project workflow, assessments, feedback, collaboration notes, modal interactions, profile state, local persistence.
- Product implication: the authenticated application should center on role-aware operational tools, not just marketing pages.

### Source 2: Shopify brand site
- Strengths: trust-building educational tone, premium tutoring message, consultation CTA, expertise framing, student success stories, program commerce, reassuring family-first voice.
- Product implication: the public site should feel polished and aspirational while staying warm, credible, and conversion-oriented.

## Final architecture

- Frontend: Next.js App Router, React Server Components, Tailwind CSS, route groups for public and authenticated surfaces.
- Auth: Supabase Auth with middleware protection, email/password now, extensible for magic links and OAuth.
- Database: Supabase Postgres with row-level security and normalized entities for profiles, students, teachers, parents, classes, projects, submissions, feedback, assessments, consultations, enrollments, and commerce events.
- Storage: Supabase Storage buckets for assignment uploads, project assets, avatars, and downloadable resources.
- Commerce: Shopify remains the storefront and checkout source of truth. Product metadata lives in Shopify and selected mirrored fields live in Supabase for in-app rendering and entitlement logic.
- Post-purchase unlocks: Shopify webhooks create or update enrollments, grant access to programs, and optionally trigger onboarding notifications.

## Route strategy

- Public marketing: `/`, `/methods`, `/programs`, `/testimonials`, `/about`, `/contact`, `/book-consultation`, `/login`, `/sign-up`
- Authenticated application: `/app/student`, `/app/teacher`, `/app/parent`, `/app/admin`
- Auth callback: `/auth/callback`
- Commerce webhook entry: `/api/shopify/webhooks`

## Folder structure

```text
app/
  page.tsx
  methods/page.tsx
  programs/page.tsx
  testimonials/page.tsx
  about/page.tsx
  contact/page.tsx
  book-consultation/page.tsx
  login/page.tsx
  sign-up/page.tsx
  auth/callback/route.ts
  app/
    layout.tsx
    student/page.tsx
    teacher/page.tsx
    parent/page.tsx
    admin/page.tsx
components/
  marketing/
  dashboard/
  providers/
lib/
  content/
  auth/
  supabase/
  shopify/
supabase/migrations/
types/
docs/
```

## Data model direction

- `profiles`: base identity and role
- `students`, `teachers`, `parents`: role-specific details
- `parent_student_links`: family relationships
- `classes`, `class_enrollments`
- `projects`, `project_submissions`, `submission_files`
- `assessments`, `assessment_results`
- `feedback_entries`
- `programs`, `enrollments`
- `consultation_requests`
- `shopify_orders`, `shopify_webhook_events`

## Security model

- Students can read and write only their own submissions and profile-linked progress.
- Teachers can access classes they own and related learner records.
- Parents can read linked child summaries and commerce-linked account data.
- Admins manage platform-wide entities and permissions.
- Storage policies mirror table access using folder conventions keyed by user id and role.
