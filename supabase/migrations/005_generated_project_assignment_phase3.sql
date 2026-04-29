create table if not exists public.generated_project_assignments (
  id uuid primary key default gen_random_uuid(),
  generated_project_id uuid not null references public.generated_projects (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  cohort_id uuid references public.cohorts (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  assigned_by uuid references public.profiles (id) on delete set null,
  status text not null default 'assigned' check (status in ('assigned', 'launched', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (generated_project_id, student_id)
);

alter table public.projects add column if not exists generated_project_id uuid references public.generated_projects (id) on delete set null;
alter table public.projects add column if not exists student_mission text;
alter table public.projects add column if not exists workspace_materials jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists workspace_reflection_questions jsonb not null default '[]'::jsonb;

create unique index if not exists projects_student_generated_project_uidx
on public.projects (student_id, generated_project_id)
where generated_project_id is not null;

create index if not exists generated_project_assignments_student_status_idx
on public.generated_project_assignments (student_id, status);

create index if not exists generated_project_assignments_generated_project_idx
on public.generated_project_assignments (generated_project_id, status);

drop trigger if exists generated_project_assignments_set_updated_at on public.generated_project_assignments;
create trigger generated_project_assignments_set_updated_at
before update on public.generated_project_assignments
for each row
execute function public.set_updated_at_generic();

alter table public.generated_project_assignments enable row level security;

drop policy if exists "generated project assignments readable" on public.generated_project_assignments;
create policy "generated project assignments readable"
on public.generated_project_assignments
for select
using (
  auth.uid() = student_id
  or public.is_admin()
  or public.is_parent_for_student(student_id)
  or public.is_assigned_teacher_for_student(student_id)
);

drop policy if exists "generated project assignments managed by staff" on public.generated_project_assignments;
create policy "generated project assignments managed by staff"
on public.generated_project_assignments
for all
using (public.can_manage_project_catalog())
with check (public.can_manage_project_catalog());
