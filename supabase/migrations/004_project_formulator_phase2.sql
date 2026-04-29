create table if not exists public.generated_projects (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  skill_goal text not null,
  grade_band text not null,
  difficulty text not null,
  duration text not null,
  student_interests text[] not null default '{}',
  hook_id uuid references public.project_hooks (id) on delete set null,
  role_id uuid references public.project_roles (id) on delete set null,
  scenario_id uuid references public.project_scenarios (id) on delete set null,
  activity_id uuid references public.project_activities (id) on delete set null,
  output_id uuid references public.project_outputs (id) on delete set null,
  hook_snapshot jsonb not null default '{}'::jsonb,
  role_snapshot jsonb not null default '{}'::jsonb,
  scenario_snapshot jsonb not null default '{}'::jsonb,
  activity_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb not null default '{}'::jsonb,
  title text not null,
  summary text not null,
  student_mission text not null,
  learning_goals jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  materials jsonb not null default '[]'::jsonb,
  rubric jsonb not null default '[]'::jsonb,
  reflection_questions jsonb not null default '[]'::jsonb,
  approval_status text not null default 'draft' check (approval_status in ('draft', 'needs_review', 'approved', 'assigned', 'archived')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generated_projects_approval_status_idx
on public.generated_projects (approval_status);

drop trigger if exists generated_projects_set_updated_at on public.generated_projects;
create trigger generated_projects_set_updated_at
before update on public.generated_projects
for each row
execute function public.set_updated_at_generic();

alter table public.generated_projects enable row level security;

drop policy if exists "generated projects readable by staff" on public.generated_projects;
create policy "generated projects readable by staff"
on public.generated_projects
for select
using (public.can_manage_project_catalog());

drop policy if exists "generated projects managed by staff" on public.generated_projects;
create policy "generated projects managed by staff"
on public.generated_projects
for all
using (public.can_manage_project_catalog())
with check (public.can_manage_project_catalog());
