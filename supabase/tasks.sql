create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  organization_id text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  stage text not null default 'General' check (stage in ('General', 'Pre-Event', 'Event Day', 'Post-Event')),
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  status text not null default 'open' check (status in ('open', 'done')),
  due_date date not null,
  assignee text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_tasks_updated_at on public.tasks;

create trigger set_tasks_updated_at
before update on public.tasks
for each row execute procedure public.set_tasks_updated_at();

insert into public.tasks (
  id,
  event_id,
  organization_id,
  created_by,
  title,
  stage,
  priority,
  status,
  due_date,
  assignee,
  notes,
  created_at,
  updated_at
)
select
  coalesce(nullif(task_item ->> 'id', '')::uuid, gen_random_uuid()),
  events.id,
  events.organization_id,
  events.owner_id,
  coalesce(nullif(task_item ->> 'title', ''), 'Untitled task'),
  coalesce(nullif(task_item ->> 'stage', ''), 'General'),
  coalesce(nullif(task_item ->> 'priority', ''), 'Medium'),
  case
    when coalesce((task_item ->> 'done')::boolean, false) then 'done'
    else 'open'
  end,
  coalesce(nullif(task_item ->> 'dueDate', '')::date, events.date),
  coalesce(task_item ->> 'assignee', ''),
  coalesce(task_item ->> 'notes', ''),
  events.created_at,
  events.updated_at
from public.events
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(events.tasks) = 'array' then events.tasks
    else '[]'::jsonb
  end
) as task_item
on conflict (id) do nothing;

alter table public.tasks enable row level security;

drop policy if exists "Users can read accessible tasks" on public.tasks;
create policy "Users can read accessible tasks"
on public.tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = tasks.event_id
      and events.organization_id = tasks.organization_id
      and profiles.organization_id = tasks.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

drop policy if exists "Users can insert accessible tasks" on public.tasks;
create policy "Users can insert accessible tasks"
on public.tasks
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = tasks.event_id
      and events.organization_id = tasks.organization_id
      and profiles.organization_id = tasks.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

drop policy if exists "Users can update accessible tasks" on public.tasks;
create policy "Users can update accessible tasks"
on public.tasks
for update
to authenticated
using (
  exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = tasks.event_id
      and events.organization_id = tasks.organization_id
      and profiles.organization_id = tasks.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
)
with check (
  exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = tasks.event_id
      and events.organization_id = tasks.organization_id
      and profiles.organization_id = tasks.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

drop policy if exists "Users can delete accessible tasks" on public.tasks;
create policy "Users can delete accessible tasks"
on public.tasks
for delete
to authenticated
using (
  exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = tasks.event_id
      and events.organization_id = tasks.organization_id
      and profiles.organization_id = tasks.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

comment on table public.tasks is 'Relational task records for Party OS event workspaces.';
