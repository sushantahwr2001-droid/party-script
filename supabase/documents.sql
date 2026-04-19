create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  organization_id text not null,
  uploaded_by uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null default 'Contract',
  notes text not null default '',
  size_bytes bigint not null default 0,
  mime_type text not null default '',
  storage_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.documents
drop column if exists file_url;

create or replace function public.set_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_documents_updated_at on public.documents;

create trigger set_documents_updated_at
before update on public.documents
for each row execute procedure public.set_documents_updated_at();

insert into public.documents (
  id,
  event_id,
  organization_id,
  uploaded_by,
  name,
  category,
  notes,
  size_bytes,
  mime_type,
  storage_path,
  created_at,
  updated_at
)
select
  coalesce(nullif(document_item ->> 'id', '')::uuid, gen_random_uuid()),
  events.id,
  events.organization_id,
  events.owner_id,
  coalesce(nullif(document_item ->> 'name', ''), 'Untitled document'),
  coalesce(nullif(document_item ->> 'category', ''), 'Contract'),
  coalesce(document_item ->> 'notes', ''),
  coalesce((document_item ->> 'sizeBytes')::bigint, 0),
  coalesce(document_item ->> 'mimeType', ''),
  null,
  events.created_at,
  events.updated_at
from public.events
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(events.documents) = 'array' then events.documents
    else '[]'::jsonb
  end
) as document_item
on conflict (id) do nothing;

alter table public.documents enable row level security;

drop policy if exists "Users can read accessible documents" on public.documents;
create policy "Users can read accessible documents"
on public.documents
for select
to authenticated
using (
  exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = documents.event_id
      and events.organization_id = documents.organization_id
      and profiles.organization_id = documents.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

drop policy if exists "Users can insert accessible documents" on public.documents;
create policy "Users can insert accessible documents"
on public.documents
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = documents.event_id
      and events.organization_id = documents.organization_id
      and profiles.organization_id = documents.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

drop policy if exists "Users can update accessible documents" on public.documents;
create policy "Users can update accessible documents"
on public.documents
for update
to authenticated
using (
  exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = documents.event_id
      and events.organization_id = documents.organization_id
      and profiles.organization_id = documents.organization_id
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
    where events.id = documents.event_id
      and events.organization_id = documents.organization_id
      and profiles.organization_id = documents.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

drop policy if exists "Users can delete accessible documents" on public.documents;
create policy "Users can delete accessible documents"
on public.documents
for delete
to authenticated
using (
  exists (
    select 1
    from public.events
    join public.profiles on profiles.id = auth.uid()
    where events.id = documents.event_id
      and events.organization_id = documents.organization_id
      and profiles.organization_id = documents.organization_id
      and (
        profiles.role = 'admin'
        or events.owner_id = auth.uid()
        or events.manager_ids ? (auth.uid())::text
      )
  )
);

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "Users can read documents storage" on storage.objects;
create policy "Users can read documents storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.organization_id = split_part(name, '/', 1)
  )
);

drop policy if exists "Users can upload documents storage" on storage.objects;
create policy "Users can upload documents storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.organization_id = split_part(name, '/', 1)
  )
);

drop policy if exists "Users can update documents storage" on storage.objects;
create policy "Users can update documents storage"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.organization_id = split_part(name, '/', 1)
  )
)
with check (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.organization_id = split_part(name, '/', 1)
  )
);

drop policy if exists "Users can delete documents storage" on storage.objects;
create policy "Users can delete documents storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.organization_id = split_part(name, '/', 1)
  )
);

comment on table public.documents is 'Relational document records for Party OS event workspaces backed by Supabase Storage.';
