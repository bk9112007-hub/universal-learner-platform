create or replace function public.can_access_program(program_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
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

create or replace function public.can_read_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profile
    where profile.id = target_profile_id
      and (
        profile.id = auth.uid()
        or public.current_user_role() in ('teacher', 'admin')
        or (
          public.current_user_role() = 'parent'
          and exists (
            select 1
            from public.parent_student_links links
            where links.parent_id = auth.uid()
              and links.student_id = profile.id
          )
        )
      )
  )
$$;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
using (public.can_read_profile(id));

create index if not exists files_bucket_storage_path_idx
on public.files (bucket, storage_path);

create index if not exists files_submission_id_idx
on public.files (submission_id);

create index if not exists parent_student_links_student_parent_idx
on public.parent_student_links (student_id, parent_id);

create index if not exists enrollments_program_status_user_idx
on public.enrollments (program_id, status, user_id);
