create extension if not exists pgcrypto;

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  organization_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.activities (
  id,
  event_id,
  organization_id,
  user_id,
  type,
  message,
  metadata,
  created_at
)
select
  coalesce(nullif(activity_item ->> 'id', '')::uuid, gen_random_uuid()),
  events.id,
  events.organization_id,
  events.owner_id,
  coalesce(nullif(activity_item ->> 'type', ''), 'LEGACY_ACTIVITY'),
  coalesce(
    nullif(activity_item ->> 'title', ''),
    nullif(activity_item ->> 'message', ''),
    'Legacy activity'
  ),
  jsonb_strip_nulls(
    jsonb_build_object(
      'meta', activity_item ->> 'meta',
      'timestamp', activity_item ->> 'timestamp'
    )
  ),
  coalesce(events.updated_at, events.created_at, timezone('utc', now()))
from public.events
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(events.activities) = 'array' then events.activities
    else '[]'::jsonb
  end
) as activity_item
on conflict (id) do nothing;

alter table public.activities enable row level security;

drop policy if exists "Users can read accessible activities" on public.activities;
create policy "Users can read accessible activities"
on public.activities
for select
to authenticated
using (
  exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = activities.event_id
      and events.organization_id = activities.organization_id
      and profiles.organization_id = activities.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

drop policy if exists "Users can insert accessible activities" on public.activities;
create policy "Users can insert accessible activities"
on public.activities
for insert
to authenticated
with check (
  (user_id is null or user_id = auth.uid())
  and exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = activities.event_id
      and events.organization_id = activities.organization_id
      and profiles.organization_id = activities.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

comment on table public.activities is 'Immutable activity log entries for Party OS event workspaces.';
