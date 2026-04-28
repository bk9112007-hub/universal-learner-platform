create or replace function public.can_manage_project_catalog()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('teacher', 'admin'), false)
$$;

create or replace function public.can_read_project_catalog_item(item_status text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.can_manage_project_catalog()
    or (auth.role() = 'authenticated' and item_status = 'approved'),
    false
  )
$$;

create table if not exists public.project_hooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  details text not null,
  status text not null default 'approved' check (status in ('draft', 'approved', 'archived')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_roles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  details text not null,
  status text not null default 'approved' check (status in ('draft', 'approved', 'archived')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_scenarios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  details text not null,
  status text not null default 'approved' check (status in ('draft', 'approved', 'archived')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  details text not null,
  status text not null default 'approved' check (status in ('draft', 'approved', 'archived')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_outputs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  details text not null,
  status text not null default 'approved' check (status in ('draft', 'approved', 'archived')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_hooks_status_idx on public.project_hooks (status);
create index if not exists project_roles_status_idx on public.project_roles (status);
create index if not exists project_scenarios_status_idx on public.project_scenarios (status);
create index if not exists project_activities_status_idx on public.project_activities (status);
create index if not exists project_outputs_status_idx on public.project_outputs (status);

drop trigger if exists project_hooks_set_updated_at on public.project_hooks;
create trigger project_hooks_set_updated_at
before update on public.project_hooks
for each row
execute function public.set_updated_at_generic();

drop trigger if exists project_roles_set_updated_at on public.project_roles;
create trigger project_roles_set_updated_at
before update on public.project_roles
for each row
execute function public.set_updated_at_generic();

drop trigger if exists project_scenarios_set_updated_at on public.project_scenarios;
create trigger project_scenarios_set_updated_at
before update on public.project_scenarios
for each row
execute function public.set_updated_at_generic();

drop trigger if exists project_activities_set_updated_at on public.project_activities;
create trigger project_activities_set_updated_at
before update on public.project_activities
for each row
execute function public.set_updated_at_generic();

drop trigger if exists project_outputs_set_updated_at on public.project_outputs;
create trigger project_outputs_set_updated_at
before update on public.project_outputs
for each row
execute function public.set_updated_at_generic();

alter table public.project_hooks enable row level security;
alter table public.project_roles enable row level security;
alter table public.project_scenarios enable row level security;
alter table public.project_activities enable row level security;
alter table public.project_outputs enable row level security;

drop policy if exists "project hooks readable by authenticated" on public.project_hooks;
create policy "project hooks readable by authenticated"
on public.project_hooks
for select
using (public.can_read_project_catalog_item(status));

drop policy if exists "project hooks managed by staff" on public.project_hooks;
create policy "project hooks managed by staff"
on public.project_hooks
for all
using (public.can_manage_project_catalog())
with check (public.can_manage_project_catalog());

drop policy if exists "project roles readable by authenticated" on public.project_roles;
create policy "project roles readable by authenticated"
on public.project_roles
for select
using (public.can_read_project_catalog_item(status));

drop policy if exists "project roles managed by staff" on public.project_roles;
create policy "project roles managed by staff"
on public.project_roles
for all
using (public.can_manage_project_catalog())
with check (public.can_manage_project_catalog());

drop policy if exists "project scenarios readable by authenticated" on public.project_scenarios;
create policy "project scenarios readable by authenticated"
on public.project_scenarios
for select
using (public.can_read_project_catalog_item(status));

drop policy if exists "project scenarios managed by staff" on public.project_scenarios;
create policy "project scenarios managed by staff"
on public.project_scenarios
for all
using (public.can_manage_project_catalog())
with check (public.can_manage_project_catalog());

drop policy if exists "project activities readable by authenticated" on public.project_activities;
create policy "project activities readable by authenticated"
on public.project_activities
for select
using (public.can_read_project_catalog_item(status));

drop policy if exists "project activities managed by staff" on public.project_activities;
create policy "project activities managed by staff"
on public.project_activities
for all
using (public.can_manage_project_catalog())
with check (public.can_manage_project_catalog());

drop policy if exists "project outputs readable by authenticated" on public.project_outputs;
create policy "project outputs readable by authenticated"
on public.project_outputs
for select
using (public.can_read_project_catalog_item(status));

drop policy if exists "project outputs managed by staff" on public.project_outputs;
create policy "project outputs managed by staff"
on public.project_outputs
for all
using (public.can_manage_project_catalog())
with check (public.can_manage_project_catalog());

insert into public.project_hooks (title, summary, details, status)
values
  (
    'Neighborhood Innovation Challenge',
    'Learners begin with a local problem that matters to people they know, then investigate how to improve daily life through thoughtful design.',
    'Use this hook when you want students to feel immediate relevance. The project should start by naming a visible neighborhood issue, gathering short interviews or observations, and identifying who is affected. A strong version of this hook invites students to design for real people, compare existing solutions, and justify why their idea is realistic, ethical, and worth trying.',
    'approved'
  ),
  (
    'Future City Under Pressure',
    'Students step into a fast-changing city where infrastructure, people, and the environment are all under strain, and they must make smart decisions quickly.',
    'Use this hook to create urgency and systems thinking. The opening should present a city facing pressure from growth, transportation problems, rising water risk, or energy demands. Students should map stakeholders, define tradeoffs, and build a response that balances safety, cost, sustainability, and public trust.',
    'approved'
  ),
  (
    'Museum Mystery Opening Night',
    'Learners are invited into a museum preparing for a major public launch, where they must turn complex content into an unforgettable visitor experience.',
    'Use this hook when you want a strong blend of research and storytelling. Students should work from a clear theme, curate information for a public audience, and decide how to organize visuals, labels, interactive moments, and explanations so visitors leave informed and curious.',
    'approved'
  ),
  (
    'Youth Media Spotlight',
    'Students are challenged to create media that explains an important issue to other young people in a way that is clear, engaging, and responsible.',
    'This hook works well for communication-heavy projects. It should begin with a real topic that students care about, then ask them to translate research into a youth-facing message. Encourage attention to audience, tone, evidence, and the difference between grabbing attention and building trust.',
    'approved'
  ),
  (
    'Mission to Rebuild After the Storm',
    'Learners enter a recovery scenario where a community is trying to rebuild after disruption and needs practical, hopeful solutions.',
    'Use this hook when you want empathy, planning, and resilience at the center of the work. Students should study what people need first, how limited resources change decisions, and how to propose a plan that supports both immediate recovery and longer-term stability.',
    'approved'
  )
on conflict do nothing;

insert into public.project_roles (title, summary, details, status)
values
  (
    'Community Design Consultant',
    'The learner acts as a consultant who studies a local challenge, proposes options, and explains recommendations to decision-makers.',
    'This role pushes students to combine research, observation, and persuasive explanation. Strong work includes stakeholder awareness, evidence-based recommendations, and a final product that sounds professional without losing accessibility for a general audience.',
    'approved'
  ),
  (
    'Museum Curator',
    'The learner serves as a curator who selects information, objects, themes, and visitor pathways for a meaningful exhibit.',
    'Use this role when you want students to synthesize knowledge and shape a learning experience for others. Good curator projects make intentional choices about inclusion, accuracy, sequencing, and how an audience will move from curiosity to understanding.',
    'approved'
  ),
  (
    'Crisis Response Planner',
    'The learner becomes a planner responsible for balancing safety, communication, logistics, and recovery during a difficult public situation.',
    'This role is valuable for projects about preparedness and decision-making under pressure. Students should show prioritization, explain tradeoffs, and produce a plan that is realistic for the people and resources available.',
    'approved'
  ),
  (
    'Youth Campaign Strategist',
    'The learner acts as a strategist building a message, plan, and creative approach that can motivate a real audience to care or act.',
    'Use this role when communication and audience targeting matter. Strong strategist work includes clear goals, audience research, message testing, and justification for the chosen medium, visuals, and call to action.',
    'approved'
  ),
  (
    'Sustainability Analyst',
    'The learner takes the role of an analyst who studies choices, compares impacts, and recommends the most responsible path forward.',
    'This role supports math, science, and reasoning-rich projects. Students should compare multiple options, define criteria, and use evidence to explain why one path is more sustainable, efficient, or equitable than another.',
    'approved'
  )
on conflict do nothing;

insert into public.project_scenarios (title, summary, details, status)
values
  (
    'A coastal city must protect homes, businesses, and public spaces before the next severe storm season.',
    'Students work inside a planning scenario where leaders need actionable ideas that reduce risk without leaving residents behind.',
    'This scenario supports geography, environmental science, and civics. It should involve constraints such as budget, public trust, infrastructure limits, and competing priorities. Strong project plans compare options and explain why the final recommendation helps both now and later.',
    'approved'
  ),
  (
    'A school wants to redesign one part of campus so it supports wellbeing, learning, and inclusion for more students.',
    'Learners investigate user needs and redesign a real school experience with practical improvements.',
    'This scenario works well for human-centered design. Students should gather student voice, identify barriers, and present a redesign that explains tradeoffs, implementation steps, and who benefits from each decision.',
    'approved'
  ),
  (
    'A public history organization needs a new way to help families connect with an overlooked chapter of the past.',
    'Students interpret history for a broad audience and turn research into an engaging public experience.',
    'Use this scenario for projects that connect research, writing, and audience empathy. High-quality work should show historical accuracy, thoughtful source use, and creative ways to help visitors care about the story being told.',
    'approved'
  ),
  (
    'A youth-focused media team wants to explain a complex current issue without oversimplifying or spreading confusion.',
    'Learners must translate complicated information into something accurate, compelling, and age-appropriate.',
    'This scenario is ideal for analytical writing and media design. Students should define the audience, choose trustworthy evidence, explain uncertainty honestly, and build a final piece that makes learning easier rather than noisier.',
    'approved'
  ),
  (
    'A nonprofit wants a pilot plan for helping a neighborhood reduce waste while keeping participation realistic for busy families.',
    'Students create a practical community-facing proposal that mixes behavior change, logistics, and public communication.',
    'This scenario supports science, math, and systems thinking. Strong responses include measurable goals, clear participation steps, likely obstacles, and a communication strategy that makes adoption feel achievable.',
    'approved'
  )
on conflict do nothing;

insert into public.project_activities (title, summary, details, status)
values
  (
    'Field Observation and Pattern Mapping',
    'Students document what they see, notice repeated issues, and organize evidence before deciding on a direction.',
    'This activity should push learners beyond assumptions. They should record observations carefully, identify patterns, separate facts from interpretations, and use what they found to justify the focus of the project.',
    'approved'
  ),
  (
    'Stakeholder Interview Sprint',
    'Students gather quick feedback from people affected by the issue and use that input to refine the problem they are solving.',
    'Use this activity when perspective-taking matters. Students should prepare strong questions, capture useful responses, and compare viewpoints so the project reflects real needs instead of only student guesses.',
    'approved'
  ),
  (
    'Prototype and Feedback Cycle',
    'Learners create an early version of an idea, test it with others, and revise based on what works or fails.',
    'This activity emphasizes iteration. Students should define what they are testing, collect feedback intentionally, explain what changed after review, and show how revision improved the quality or clarity of the solution.',
    'approved'
  ),
  (
    'Evidence Comparison Workshop',
    'Students compare multiple sources, claims, or options and decide which evidence is most trustworthy and useful.',
    'This activity supports reasoning across subjects. High-quality work includes source comparison, explanation of credibility, and a clear rationale for how evidence shaped the project decisions.',
    'approved'
  ),
  (
    'Public Presentation Rehearsal',
    'Students practice explaining their work to a real audience and refine clarity, pacing, visuals, and confidence before sharing.',
    'Use this activity near the end of a project. Learners should anticipate audience questions, tighten explanations, and make sure the final presentation communicates both the process and the why behind their choices.',
    'approved'
  )
on conflict do nothing;

insert into public.project_outputs (title, summary, details, status)
values
  (
    'Strategic Proposal Deck',
    'Students deliver a structured slide deck that explains the problem, evidence, recommendation, and implementation path.',
    'This output is useful when the project should feel decision-ready. Strong decks include clear visuals, concise evidence, a well-defended recommendation, and next steps that make the audience feel the idea could actually move forward.',
    'approved'
  ),
  (
    'Interactive Exhibit Plan',
    'Learners produce a visitor-facing exhibit concept that combines content, layout, and engagement design.',
    'Use this output for museum, history, or public-learning projects. The final plan should explain theme, sections, visitor flow, interactive features, and how the audience will leave with a deeper understanding.',
    'approved'
  ),
  (
    'Community Action Blueprint',
    'Students present a practical blueprint that shows what should happen, who should do it, and how success will be measured.',
    'This output works for civic and service-oriented work. Strong blueprints are concrete, phased, measurable, and realistic about constraints such as time, resources, and participation.',
    'approved'
  ),
  (
    'Youth Media Campaign Kit',
    'Learners create a campaign package with core messages, creative assets, audience strategy, and launch recommendations.',
    'This output fits communication-rich projects. Students should show message discipline, audience awareness, and consistency across media elements while explaining why the package is likely to reach and influence its intended audience.',
    'approved'
  ),
  (
    'Prototype Demonstration and Reflection Report',
    'Students submit a demonstration of what they built alongside a report that explains testing, revision, and learning.',
    'Use this output when building and iteration are central. The final submission should show the prototype in action, discuss evidence from testing, and honestly evaluate what still needs improvement.',
    'approved'
  )
on conflict do nothing;
