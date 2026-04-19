create extension if not exists pgcrypto;

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  organization_id text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null default 'General',
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  cost numeric not null default 0,
  status text not null default 'Quoted' check (status in ('Quoted', 'Confirmed', 'Paid')),
  notes text not null default '',
  linked_document_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_vendors_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_vendors_updated_at on public.vendors;

create trigger set_vendors_updated_at
before update on public.vendors
for each row execute procedure public.set_vendors_updated_at();

insert into public.vendors (
  id,
  event_id,
  organization_id,
  created_by,
  name,
  category,
  contact_name,
  email,
  phone,
  cost,
  status,
  notes,
  linked_document_id,
  created_at,
  updated_at
)
select
  coalesce(nullif(vendor_item ->> 'id', '')::uuid, gen_random_uuid()),
  events.id,
  events.organization_id,
  events.owner_id,
  coalesce(nullif(vendor_item ->> 'name', ''), 'Untitled vendor'),
  coalesce(nullif(vendor_item ->> 'category', ''), 'General'),
  coalesce(vendor_item ->> 'contactName', ''),
  coalesce(vendor_item ->> 'email', ''),
  coalesce(vendor_item ->> 'phone', ''),
  coalesce((vendor_item ->> 'cost')::numeric, 0),
  coalesce(nullif(vendor_item ->> 'status', ''), 'Quoted'),
  coalesce(vendor_item ->> 'notes', ''),
  nullif(vendor_item ->> 'linkedDocumentId', '')::uuid,
  events.created_at,
  events.updated_at
from public.events
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(events.vendors) = 'array' then events.vendors
    else '[]'::jsonb
  end
) as vendor_item
on conflict (id) do nothing;

alter table public.vendors enable row level security;

drop policy if exists "Users can read accessible vendors" on public.vendors;
create policy "Users can read accessible vendors"
on public.vendors
for select
to authenticated
using (
  exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = vendors.event_id
      and events.organization_id = vendors.organization_id
      and profiles.organization_id = vendors.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

drop policy if exists "Users can insert accessible vendors" on public.vendors;
create policy "Users can insert accessible vendors"
on public.vendors
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = vendors.event_id
      and events.organization_id = vendors.organization_id
      and profiles.organization_id = vendors.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

drop policy if exists "Users can update accessible vendors" on public.vendors;
create policy "Users can update accessible vendors"
on public.vendors
for update
to authenticated
using (
  exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = vendors.event_id
      and events.organization_id = vendors.organization_id
      and profiles.organization_id = vendors.organization_id
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
    where events.id = vendors.event_id
      and events.organization_id = vendors.organization_id
      and profiles.organization_id = vendors.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

drop policy if exists "Users can delete accessible vendors" on public.vendors;
create policy "Users can delete accessible vendors"
on public.vendors
for delete
to authenticated
using (
  exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = vendors.event_id
      and events.organization_id = vendors.organization_id
      and profiles.organization_id = vendors.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

comment on table public.vendors is 'Relational vendor records for Party OS event workspaces.';
