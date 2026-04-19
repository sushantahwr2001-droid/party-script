create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  manager_ids jsonb not null default '[]'::jsonb,
  name text not null,
  type text not null default 'Event',
  date date not null,
  venue text not null default '',
  notes text not null default '',
  budget numeric not null default 0,
  status text not null default 'Planning',
  contacts jsonb not null default '[]'::jsonb,
  vendors jsonb not null default '[]'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_events_updated_at on public.events;

create trigger set_events_updated_at
before update on public.events
for each row execute procedure public.set_events_updated_at();

alter table public.events enable row level security;

drop policy if exists "Users can read organization events" on public.events;
create policy "Users can read organization events"
on public.events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.organization_id = events.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

drop policy if exists "Users can insert their own events" on public.events;
create policy "Users can insert their own events"
on public.events
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.organization_id = events.organization_id
  )
);

drop policy if exists "Users can update accessible events" on public.events;
create policy "Users can update accessible events"
on public.events
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.organization_id = events.organization_id
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
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.organization_id = events.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

drop policy if exists "Users can delete accessible events" on public.events;
create policy "Users can delete accessible events"
on public.events
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.organization_id = events.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

comment on table public.events is 'Party OS event workspaces with embedded contacts, vendors, tasks, documents, and activities.';
