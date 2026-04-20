create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('student', 'teacher', 'parent', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum ('draft', 'submitted', 'reviewed', 'needs_revision');
  end if;
  if not exists (select 1 from pg_type where typname = 'assessment_status') then
    create type public.assessment_status as enum ('assigned', 'submitted', 'graded');
  end if;
  if not exists (select 1 from pg_type where typname = 'assessment_question_type') then
    create type public.assessment_question_type as enum ('multiple_choice', 'short_answer', 'true_false');
  end if;
  if not exists (select 1 from pg_type where typname = 'resource_type') then
    create type public.resource_type as enum ('link', 'file');
  end if;
  if not exists (select 1 from pg_type where typname = 'lesson_progress_status') then
    create type public.lesson_progress_status as enum ('not_started', 'in_progress', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'lesson_task_type') then
    create type public.lesson_task_type as enum ('checkpoint', 'submission');
  end if;
  if not exists (select 1 from pg_type where typname = 'lesson_task_status') then
    create type public.lesson_task_status as enum ('not_started', 'in_progress', 'submitted', 'completed', 'needs_revision');
  end if;
end $$;

create table if not exists public.roles (
  id public.user_role primary key,
  label text not null,
  created_at timestamptz not null default now()
);

insert into public.roles (id, label)
values
  ('student', 'Student'),
  ('teacher', 'Teacher'),
  ('parent', 'Parent'),
  ('admin', 'Admin')
on conflict (id) do update set label = excluded.label;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  role public.user_role not null default 'student',
  avatar_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  price_cents integer not null default 0,
  shopify_product_id text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.programs (title, slug, description, price_cents, shopify_product_id, is_active)
values
  ('Grade Ace Tutoring', 'grade-ace-tutoring', 'Targeted support for better grades, stronger routines, and renewed academic confidence.', 1, null, true),
  ('The Scholar Program', 'the-scholar-program', 'Structured tutoring with deeper skill-building across core subjects and study systems.', 8999, null, true),
  ('The Universal Learner Program', 'the-universal-learner-program', 'A premium blend of tutoring, project-based learning, and strategic growth support.', 9999, null, true)
on conflict (slug) do nothing;

create table if not exists public.program_modules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.program_lessons (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  module_id uuid not null references public.program_modules (id) on delete cascade,
  title text not null,
  summary text not null default '',
  content text not null default '',
  sort_order integer not null default 0,
  estimated_minutes integer not null default 15,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_tasks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.program_lessons (id) on delete cascade,
  title text not null,
  instructions text not null default '',
  task_type public.lesson_task_type not null default 'checkpoint',
  sort_order integer not null default 0,
  is_required boolean not null default true,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_student_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  cohort_id uuid references public.cohorts (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (teacher_id, student_id)
);

create table if not exists public.program_resources (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  module_id uuid references public.program_modules (id) on delete cascade,
  lesson_id uuid references public.program_lessons (id) on delete cascade,
  title text not null,
  description text not null default '',
  resource_type public.resource_type not null default 'link',
  external_url text,
  bucket text,
  storage_path text,
  file_name text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  lesson_id uuid not null references public.program_lessons (id) on delete cascade,
  status public.lesson_progress_status not null default 'not_started',
  last_viewed_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.lesson_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  lesson_id uuid not null references public.program_lessons (id) on delete cascade,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.lesson_task_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  lesson_id uuid not null references public.program_lessons (id) on delete cascade,
  task_id uuid not null references public.lesson_tasks (id) on delete cascade,
  status public.lesson_task_status not null default 'not_started',
  response_text text,
  project_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, task_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  lesson_id uuid references public.program_lessons (id) on delete set null,
  lesson_task_id uuid references public.lesson_tasks (id) on delete set null,
  title text not null,
  subject text not null,
  description text not null,
  status public.project_status not null default 'submitted',
  created_at timestamptz not null default now()
);

alter table public.projects add column if not exists program_id uuid references public.programs (id) on delete set null;
alter table public.projects add column if not exists lesson_id uuid references public.program_lessons (id) on delete set null;
alter table public.projects add column if not exists lesson_task_id uuid references public.lesson_tasks (id) on delete set null;
alter table public.lesson_task_progress add column if not exists project_id uuid references public.projects (id) on delete set null;
alter table public.lesson_tasks add column if not exists due_date date;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  submission_text text not null,
  status public.project_status not null default 'submitted',
  submitted_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  submission_id uuid not null references public.submissions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  teacher_name text not null,
  score numeric(4, 1) not null check (score >= 0 and score <= 10),
  comment text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  subject text not null,
  description text not null default '',
  status public.assessment_status not null default 'assigned',
  due_date date,
  score numeric(4, 1),
  teacher_comment text,
  created_at timestamptz not null default now()
);

alter table public.assessments add column if not exists topic text;
alter table public.assessments add column if not exists ai_score numeric(4, 1);
alter table public.assessments add column if not exists teacher_override_score numeric(4, 1);
alter table public.assessments add column if not exists ai_feedback text;
alter table public.assessments add column if not exists weak_topics text[] not null default '{}';
alter table public.assessments add column if not exists source text not null default 'manual';
alter table public.assessments add column if not exists cohort_id uuid references public.cohorts (id) on delete set null;
alter table public.assessments add column if not exists completed_at timestamptz;
alter table public.assessments add column if not exists reviewed_at timestamptz;

create table if not exists public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  prompt text not null,
  question_type public.assessment_question_type not null default 'multiple_choice',
  topic text not null default 'General',
  sort_order integer not null default 0,
  points integer not null default 1,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  correct_answer_keywords jsonb not null default '[]'::jsonb,
  explanation text,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_responses (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  question_id uuid not null references public.assessment_questions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  response_text text,
  is_correct boolean,
  score_awarded numeric(5, 2),
  ai_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, question_id, student_id)
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  shopify_order_id text not null unique,
  email text,
  amount_cents integer,
  currency text,
  status text not null default 'paid',
  processing_state text not null default 'received',
  processing_error text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  source_purchase_id uuid references public.purchases (id) on delete set null,
  status text not null default 'active',
  access_reason text,
  granted_by_admin_id uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz,
  revoked_by_admin_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, program_id)
);

create table if not exists public.pending_program_access (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  program_id uuid not null references public.programs (id) on delete cascade,
  purchase_id uuid references public.purchases (id) on delete set null,
  status text not null default 'pending',
  claimed_by_user_id uuid references public.profiles (id) on delete set null,
  resolved_by_admin_id uuid references public.profiles (id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  unique (email, program_id, purchase_id)
);

create table if not exists public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  submission_id uuid references public.submissions (id) on delete cascade,
  bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  created_at timestamptz not null default now()
);

create or replace function public.set_program_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at
before update on public.programs
for each row
execute function public.set_program_updated_at();

drop trigger if exists program_modules_set_updated_at on public.program_modules;
create trigger program_modules_set_updated_at
before update on public.program_modules
for each row
execute function public.set_program_updated_at();

drop trigger if exists program_lessons_set_updated_at on public.program_lessons;
create trigger program_lessons_set_updated_at
before update on public.program_lessons
for each row
execute function public.set_program_updated_at();

drop trigger if exists lesson_tasks_set_updated_at on public.lesson_tasks;
create trigger lesson_tasks_set_updated_at
before update on public.lesson_tasks
for each row
execute function public.set_program_updated_at();

drop trigger if exists program_resources_set_updated_at on public.program_resources;
create trigger program_resources_set_updated_at
before update on public.program_resources
for each row
execute function public.set_program_updated_at();

create or replace function public.set_updated_at_generic()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_lesson_progress_set_updated_at on public.user_lesson_progress;
create trigger user_lesson_progress_set_updated_at
before update on public.user_lesson_progress
for each row
execute function public.set_updated_at_generic();

drop trigger if exists lesson_reflections_set_updated_at on public.lesson_reflections;
create trigger lesson_reflections_set_updated_at
before update on public.lesson_reflections
for each row
execute function public.set_updated_at_generic();

drop trigger if exists lesson_task_progress_set_updated_at on public.lesson_task_progress;
create trigger lesson_task_progress_set_updated_at
before update on public.lesson_task_progress
for each row
execute function public.set_updated_at_generic();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_teacher_or_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() in ('teacher', 'admin'), false)
$$;

create or replace function public.is_assigned_teacher_for_student(student_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.teacher_student_assignments
    where teacher_id = auth.uid() and student_id = student_uuid
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_parent_for_student(student_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.parent_student_links
    where parent_id = auth.uid() and student_id = student_uuid
  )
$$;

create or replace function public.can_access_program(program_uuid uuid)
returns boolean
language sql
stable
as $$
  select (
    public.is_admin()
    or exists (
      select 1
      from public.enrollments
      where enrollments.program_id = program_uuid
        and enrollments.status = 'active'
        and enrollments.user_id = auth.uid()
    )
    or (
      public.current_user_role() = 'parent'
      and exists (
        select 1
        from public.enrollments e
        join public.parent_student_links links on links.student_id = e.user_id
        where e.program_id = program_uuid
          and e.status = 'active'
          and links.parent_id = auth.uid()
      )
    )
  )
$$;

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.program_modules enable row level security;
alter table public.program_lessons enable row level security;
alter table public.lesson_tasks enable row level security;
alter table public.cohorts enable row level security;
alter table public.teacher_student_assignments enable row level security;
alter table public.program_resources enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.lesson_reflections enable row level security;
alter table public.lesson_task_progress enable row level security;
alter table public.projects enable row level security;
alter table public.submissions enable row level security;
alter table public.feedback enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_responses enable row level security;
alter table public.purchases enable row level security;
alter table public.enrollments enable row level security;
alter table public.pending_program_access enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.files enable row level security;

drop policy if exists "roles are readable by authenticated users" on public.roles;
create policy "roles are readable by authenticated users"
on public.roles
for select
using (auth.role() = 'authenticated');

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
using (
  auth.uid() = id
  or public.is_teacher_or_admin()
  or (public.current_user_role() = 'parent' and exists (
    select 1 from public.parent_student_links links
    where links.parent_id = auth.uid() and links.student_id = profiles.id
  ))
);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "authenticated can read active programs" on public.programs;
create policy "authenticated can read active programs"
on public.programs
for select
using (auth.role() = 'authenticated');

drop policy if exists "admins can manage programs" on public.programs;
create policy "admins can manage programs"
on public.programs
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users can read accessible modules" on public.program_modules;
create policy "users can read accessible modules"
on public.program_modules
for select
using (public.can_access_program(program_id) or public.is_teacher_or_admin());

drop policy if exists "admins can manage modules" on public.program_modules;
create policy "admins can manage modules"
on public.program_modules
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users can read accessible lessons" on public.program_lessons;
create policy "users can read accessible lessons"
on public.program_lessons
for select
using (public.can_access_program(program_id) or public.is_teacher_or_admin());

drop policy if exists "admins can manage lessons" on public.program_lessons;
create policy "admins can manage lessons"
on public.program_lessons
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users can read accessible lesson tasks" on public.lesson_tasks;
create policy "users can read accessible lesson tasks"
on public.lesson_tasks
for select
using (
  public.is_teacher_or_admin()
  or
  exists (
    select 1
    from public.program_lessons lessons
    where lessons.id = lesson_tasks.lesson_id
      and public.can_access_program(lessons.program_id)
  )
);

drop policy if exists "admins can manage lesson tasks" on public.lesson_tasks;
create policy "admins can manage lesson tasks"
on public.lesson_tasks
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "teachers manage own lesson tasks" on public.lesson_tasks;
create policy "teachers manage own lesson tasks"
on public.lesson_tasks
for all
using (
  public.is_teacher_or_admin()
)
with check (
  public.is_teacher_or_admin()
);

drop policy if exists "teachers read own cohorts" on public.cohorts;
create policy "teachers read own cohorts"
on public.cohorts
for select
using (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "teachers manage own cohorts" on public.cohorts;
create policy "teachers manage own cohorts"
on public.cohorts
for all
using (teacher_id = auth.uid() or public.is_admin())
with check (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "teachers read own assignments" on public.teacher_student_assignments;
create policy "teachers read own assignments"
on public.teacher_student_assignments
for select
using (
  teacher_id = auth.uid()
  or student_id = auth.uid()
  or public.is_admin()
  or (public.current_user_role() = 'parent' and public.is_parent_for_student(student_id))
);

drop policy if exists "teachers manage own assignments" on public.teacher_student_assignments;
create policy "teachers manage own assignments"
on public.teacher_student_assignments
for all
using (teacher_id = auth.uid() or public.is_admin())
with check (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "users can read accessible resources" on public.program_resources;
create policy "users can read accessible resources"
on public.program_resources
for select
using (public.can_access_program(program_id) or public.is_teacher_or_admin());

drop policy if exists "admins can manage resources" on public.program_resources;
create policy "admins can manage resources"
on public.program_resources
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users can read own progress" on public.user_lesson_progress;
create policy "users can read own progress"
on public.user_lesson_progress
for select
using (
  auth.uid() = user_id
  or public.is_teacher_or_admin()
  or public.is_admin()
  or (public.current_user_role() = 'parent' and public.is_parent_for_student(user_id))
);

drop policy if exists "users can manage own progress" on public.user_lesson_progress;
create policy "users can manage own progress"
on public.user_lesson_progress
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can read lesson reflections" on public.lesson_reflections;
create policy "users can read lesson reflections"
on public.lesson_reflections
for select
using (
  auth.uid() = user_id
  or public.is_teacher_or_admin()
  or public.is_admin()
  or (public.current_user_role() = 'parent' and public.is_parent_for_student(user_id))
);

drop policy if exists "users can manage own lesson reflections" on public.lesson_reflections;
create policy "users can manage own lesson reflections"
on public.lesson_reflections
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can read lesson task progress" on public.lesson_task_progress;
create policy "users can read lesson task progress"
on public.lesson_task_progress
for select
using (
  auth.uid() = user_id
  or public.is_teacher_or_admin()
  or public.is_admin()
  or (public.current_user_role() = 'parent' and public.is_parent_for_student(user_id))
);

drop policy if exists "users can manage own lesson task progress" on public.lesson_task_progress;
create policy "users can manage own lesson task progress"
on public.lesson_task_progress
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "students manage own projects" on public.projects;
create policy "students manage own projects"
on public.projects
for all
using (auth.uid() = student_id)
with check (auth.uid() = student_id);

drop policy if exists "teachers can read projects" on public.projects;
create policy "teachers can read projects"
on public.projects
for select
using (public.is_teacher_or_admin());

drop policy if exists "parents can read linked student projects" on public.projects;
create policy "parents can read linked student projects"
on public.projects
for select
using (public.is_parent_for_student(student_id));

drop policy if exists "teachers can update project status" on public.projects;
create policy "teachers can update project status"
on public.projects
for update
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

drop policy if exists "students manage own submissions" on public.submissions;
create policy "students manage own submissions"
on public.submissions
for all
using (auth.uid() = student_id)
with check (auth.uid() = student_id);

drop policy if exists "teachers can read submissions" on public.submissions;
create policy "teachers can read submissions"
on public.submissions
for select
using (public.is_teacher_or_admin());

drop policy if exists "parents can read linked student submissions" on public.submissions;
create policy "parents can read linked student submissions"
on public.submissions
for select
using (public.is_parent_for_student(student_id));

drop policy if exists "teachers can update submission status" on public.submissions;
create policy "teachers can update submission status"
on public.submissions
for update
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

drop policy if exists "students can read own feedback" on public.feedback;
create policy "students can read own feedback"
on public.feedback
for select
using (auth.uid() = student_id);

drop policy if exists "teachers can read feedback" on public.feedback;
create policy "teachers can read feedback"
on public.feedback
for select
using (public.is_teacher_or_admin());

drop policy if exists "parents can read linked student feedback" on public.feedback;
create policy "parents can read linked student feedback"
on public.feedback
for select
using (public.is_parent_for_student(student_id));

drop policy if exists "teachers can create feedback" on public.feedback;
create policy "teachers can create feedback"
on public.feedback
for insert
with check (public.is_teacher_or_admin() and auth.uid() = teacher_id);

drop policy if exists "teachers can update feedback" on public.feedback;
create policy "teachers can update feedback"
on public.feedback
for update
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

drop policy if exists "students can read own assessments" on public.assessments;
create policy "students can read own assessments"
on public.assessments
for select
using (auth.uid() = student_id or public.is_teacher_or_admin());

drop policy if exists "parents can read linked student assessments" on public.assessments;
create policy "parents can read linked student assessments"
on public.assessments
for select
using (public.is_parent_for_student(student_id));

drop policy if exists "teachers can manage assessments" on public.assessments;
create policy "teachers can manage assessments"
on public.assessments
for all
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin() and auth.uid() = teacher_id);

drop policy if exists "students and teachers can read assessment questions" on public.assessment_questions;
create policy "students and teachers can read assessment questions"
on public.assessment_questions
for select
using (
  exists (
    select 1
    from public.assessments
    where assessments.id = assessment_questions.assessment_id
      and (
        auth.uid() = assessments.student_id
        or public.is_teacher_or_admin()
        or public.is_parent_for_student(assessments.student_id)
      )
  )
);

drop policy if exists "teachers manage assessment questions" on public.assessment_questions;
create policy "teachers manage assessment questions"
on public.assessment_questions
for all
using (
  exists (
    select 1
    from public.assessments
    where assessments.id = assessment_questions.assessment_id
      and public.is_teacher_or_admin()
  )
)
with check (
  exists (
    select 1
    from public.assessments
    where assessments.id = assessment_questions.assessment_id
      and public.is_teacher_or_admin()
  )
);

drop policy if exists "students can manage own assessment responses" on public.assessment_responses;
create policy "students can manage own assessment responses"
on public.assessment_responses
for all
using (
  auth.uid() = student_id
  and exists (
    select 1
    from public.assessments
    where assessments.id = assessment_responses.assessment_id
      and assessments.student_id = auth.uid()
  )
)
with check (
  auth.uid() = student_id
  and exists (
    select 1
    from public.assessments
    where assessments.id = assessment_responses.assessment_id
      and assessments.student_id = auth.uid()
  )
);

drop policy if exists "teachers and parents can read assessment responses" on public.assessment_responses;
create policy "teachers and parents can read assessment responses"
on public.assessment_responses
for select
using (
  exists (
    select 1
    from public.assessments
    where assessments.id = assessment_responses.assessment_id
      and (
        public.is_teacher_or_admin()
        or public.is_parent_for_student(assessments.student_id)
      )
  )
);

drop policy if exists "users read own purchases" on public.purchases;
create policy "users read own purchases"
on public.purchases
for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "admins manage purchases" on public.purchases;
create policy "admins manage purchases"
on public.purchases
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users read own enrollments" on public.enrollments;
create policy "users read own enrollments"
on public.enrollments
for select
using (
  auth.uid() = user_id
  or public.is_teacher_or_admin()
  or public.is_admin()
  or (public.current_user_role() = 'parent' and public.is_parent_for_student(user_id))
);

drop policy if exists "admins manage enrollments" on public.enrollments;
create policy "admins manage enrollments"
on public.enrollments
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users read own pending access" on public.pending_program_access;
create policy "users read own pending access"
on public.pending_program_access
for select
using (
  public.is_admin()
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "admins manage pending access" on public.pending_program_access;
create policy "admins manage pending access"
on public.pending_program_access
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "parents read own links" on public.parent_student_links;
create policy "parents read own links"
on public.parent_student_links
for select
using (auth.uid() = parent_id or public.is_admin());

drop policy if exists "parents create own links" on public.parent_student_links;
create policy "parents create own links"
on public.parent_student_links
for insert
with check (auth.uid() = parent_id or public.is_admin());

drop policy if exists "parents delete own links" on public.parent_student_links;
create policy "parents delete own links"
on public.parent_student_links
for delete
using (auth.uid() = parent_id or public.is_admin());

drop policy if exists "users read own files" on public.files;
create policy "users read own files"
on public.files
for select
using (
  auth.uid() = owner_id
  or public.is_teacher_or_admin()
  or exists (
    select 1 from public.submissions s
    where s.id = files.submission_id and public.is_parent_for_student(s.student_id)
  )
);

drop policy if exists "users manage own files" on public.files;
create policy "users manage own files"
on public.files
for all
using (auth.uid() = owner_id or public.is_admin())
with check (auth.uid() = owner_id or public.is_admin());

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('program-resources', 'program-resources', false)
on conflict (id) do nothing;

drop policy if exists "authenticated can upload submission objects" on storage.objects;
create policy "authenticated can upload submission objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'submissions'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "owners can read submission objects" on storage.objects;
create policy "owners can read submission objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'submissions'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_teacher_or_admin()
    or exists (
      select 1
      from public.files f
      join public.submissions s on s.id = f.submission_id
      where f.bucket = bucket_id
        and f.storage_path = name
        and public.is_parent_for_student(s.student_id)
    )
  )
);

drop policy if exists "owners can update submission objects" on storage.objects;
create policy "owners can update submission objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'submissions'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'submissions'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "owners can delete submission objects" on storage.objects;
create policy "owners can delete submission objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'submissions'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "admins can manage program resources bucket" on storage.objects;
create policy "admins can manage program resources bucket"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'program-resources'
  and public.is_admin()
)
with check (
  bucket_id = 'program-resources'
  and public.is_admin()
);

create table if not exists public.notification_settings (
  type text primary key,
  label text not null,
  description text not null,
  audience public.user_role not null,
  is_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  updated_by_admin_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.user_role not null,
  type text not null,
  title text not null,
  body text not null,
  action_href text,
  dedupe_key text not null unique,
  status text not null default 'unread',
  email_status text not null default 'not_requested',
  email_error text,
  metadata jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null default now(),
  read_at timestamptz,
  archived_at timestamptz,
  email_attempted_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notifications add column if not exists archived_at timestamptz;

create table if not exists public.notification_user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type)
);

create table if not exists public.notification_runs (
  id uuid primary key default gen_random_uuid(),
  trigger_source text not null,
  triggered_by_admin_id uuid references public.profiles (id) on delete set null,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  users_processed integer not null default 0,
  notifications_created integer not null default 0,
  emails_attempted integer not null default 0,
  emails_sent integer not null default 0,
  emails_failed integer not null default 0,
  summary text,
  error_message text,
  created_at timestamptz not null default now()
);

insert into public.notification_settings (type, label, description, audience, is_enabled, in_app_enabled, email_enabled)
values
  ('student_due_soon', 'Student due-soon reminders', 'Remind students when lesson work is due within three days.', 'student', true, true, false),
  ('student_overdue', 'Student overdue reminders', 'Alert students when lesson work becomes overdue.', 'student', true, true, false),
  ('teacher_pending_review', 'Teacher pending-review alerts', 'Summarize submitted learner work waiting for review.', 'teacher', true, true, false),
  ('teacher_overdue_attention', 'Teacher overdue-attention alerts', 'Summarize learners and tasks needing overdue attention.', 'teacher', true, true, false),
  ('parent_due_summary', 'Parent due-soon summaries', 'Show read-only due-soon summaries for linked learners.', 'parent', true, true, false),
  ('parent_overdue_summary', 'Parent overdue summaries', 'Show read-only overdue summaries for linked learners.', 'parent', true, true, false)
on conflict (type) do nothing;

create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_type_created_idx on public.notifications (type, created_at desc);

alter table public.notification_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_user_preferences enable row level security;
alter table public.notification_runs enable row level security;

drop policy if exists "admins manage notification settings" on public.notification_settings;
create policy "admins manage notification settings"
on public.notification_settings
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins read notifications" on public.notifications;
create policy "admins read notifications"
on public.notifications
for select
using (public.is_admin());

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications"
on public.notifications
for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications"
on public.notifications
for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "users manage own notification preferences" on public.notification_user_preferences;
create policy "users manage own notification preferences"
on public.notification_user_preferences
for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "admins read notification runs" on public.notification_runs;
create policy "admins read notification runs"
on public.notification_runs
for select
using (public.is_admin());

drop policy if exists "admins manage notification runs" on public.notification_runs;
create policy "admins manage notification runs"
on public.notification_runs
for all
using (public.is_admin())
with check (public.is_admin());
