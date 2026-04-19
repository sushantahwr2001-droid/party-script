alter table public.events
drop column if exists vendors,
drop column if exists tasks,
drop column if exists documents,
drop column if exists activities;

comment on table public.events is 'Party OS event workspaces with embedded contacts and relational modules for tasks, vendors, documents, and activities.';
