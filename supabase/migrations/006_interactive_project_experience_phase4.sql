create or replace function public.infer_project_experience_type(
  content_subject text,
  content_title text,
  content_description text,
  output_title text default null
)
returns text
language sql
immutable
set search_path = public
as $$
  with source as (
    select lower(
      coalesce(content_subject, '') || ' ' ||
      coalesce(content_title, '') || ' ' ||
      coalesce(content_description, '') || ' ' ||
      coalesce(output_title, '')
    ) as text_blob
  )
  select case
    when text_blob ~ '(math|algebra|geometry|ratio|equation|graph|budget|finance|statistics|calculator)' then 'math_lab'
    when text_blob ~ '(museum|exhibit|artifact|curator|gallery|archive|display case)' then 'museum_exhibit'
    when text_blob ~ '(tour|guide|travel|country|habitat|ecosystem|planet|spacewalk|expedition|field journal)' then 'guided_tour'
    when text_blob ~ '(map|cartography|route|atlas)' then 'interactive_map'
    when text_blob ~ '(simulation|experiment|lab test|prototype trial)' then 'science_simulation'
    when text_blob ~ '(timeline|era|chronology|sequence of events)' then 'timeline'
    when text_blob ~ '(debate|trial|hearing|case brief)' then 'debate_trial'
    when text_blob ~ '(business pitch|startup|investor|product launch)' then 'business_pitch'
    when text_blob ~ '(data lab|analytics|dataset|data story)' then 'data_lab'
    else 'mission_dashboard'
  end
  from source;
$$;

alter table public.generated_projects
  add column if not exists experience_type text;

alter table public.projects
  add column if not exists experience_type text;

alter table public.generated_projects
  alter column experience_type set default 'mission_dashboard';

alter table public.projects
  alter column experience_type set default 'mission_dashboard';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'generated_projects_experience_type_check'
  ) then
    alter table public.generated_projects
      add constraint generated_projects_experience_type_check
      check (experience_type in (
        'guided_tour',
        'interactive_map',
        'math_lab',
        'science_simulation',
        'timeline',
        'museum_exhibit',
        'mission_dashboard',
        'debate_trial',
        'business_pitch',
        'data_lab'
      ));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_experience_type_check'
  ) then
    alter table public.projects
      add constraint projects_experience_type_check
      check (experience_type in (
        'guided_tour',
        'interactive_map',
        'math_lab',
        'science_simulation',
        'timeline',
        'museum_exhibit',
        'mission_dashboard',
        'debate_trial',
        'business_pitch',
        'data_lab'
      ));
  end if;
end $$;

update public.generated_projects
set experience_type = public.infer_project_experience_type(
  subject,
  title,
  summary,
  coalesce(output_snapshot ->> 'title', '')
)
where experience_type is null;

update public.projects
set experience_type = case
  when generated_project_id is not null then (
    select gp.experience_type
    from public.generated_projects gp
    where gp.id = public.projects.generated_project_id
  )
  else public.infer_project_experience_type(subject, title, description, null)
end
where experience_type is null;
