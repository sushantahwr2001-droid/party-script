create table if not exists organizations (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  name text not null,
  type text not null,
  city text not null,
  country text not null,
  venue text not null,
  start_date date not null,
  end_date date not null,
  owner_user_id text not null references users(id),
  status text not null,
  health integer not null default 0,
  expected_attendees integer not null default 0,
  expected_leads integer not null default 0,
  budget_total bigint not null default 0,
  budget_spent bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists opportunities (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  name text not null,
  event_type text not null,
  industry text not null,
  organizer text not null,
  city text not null,
  country text not null,
  start_date date not null,
  end_date date not null,
  participation_type text not null,
  booth_needed boolean not null default false,
  expected_reach integer not null default 0,
  expected_leads integer not null default 0,
  strategic_fit_score integer not null default 0,
  estimated_cost bigint not null default 0,
  priority text not null,
  decision text not null,
  owner_user_id text not null references users(id),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  title text not null,
  event_id text not null references events(id) on delete cascade,
  assignee_user_id text not null references users(id),
  due_date date not null,
  priority text not null,
  status text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists vendors (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  event_id text not null references events(id) on delete cascade,
  name text not null,
  category text not null,
  deliverable text not null,
  owner_user_id text not null references users(id),
  status text not null,
  payment_status text not null,
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  event_id text not null references events(id) on delete cascade,
  category text not null,
  budgeted bigint not null default 0,
  actual bigint not null default 0,
  committed bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  full_name text not null,
  company text not null,
  title text not null,
  email text not null,
  phone text not null,
  event_id text not null references events(id) on delete cascade,
  owner_user_id text not null references users(id),
  priority text not null,
  qualification_status text not null,
  next_action text not null,
  next_follow_up_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists booths (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  event_id text not null references events(id) on delete cascade,
  status text not null,
  setup_completion integer not null default 0,
  material_readiness integer not null default 0,
  staff_assigned integer not null default 0,
  meetings_booked integer not null default 0,
  leads_captured integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists booth_checklist_items (
  id text primary key,
  booth_id text not null references booths(id) on delete cascade,
  owner_user_id text not null references users(id),
  label text not null,
  due_date date not null,
  status text not null
);

create table if not exists attendees (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  event_id text not null references events(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null default '',
  company text not null default '',
  city text not null default '',
  ticket_type text not null default 'General',
  registration_status text not null default 'Confirmed',
  check_in_status text not null default 'Pending',
  source text not null default 'Manual',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists checkins (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  attendee_id text not null references attendees(id) on delete cascade,
  event_id text not null references events(id) on delete cascade,
  status text not null,
  checked_in_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists assets (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  event_id text not null references events(id) on delete cascade,
  name text not null,
  category text not null,
  file_url text not null,
  created_by_user_id text not null references users(id),
  created_at timestamptz not null default now()
);

create table if not exists activities (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  actor_user_id text not null references users(id),
  kind text not null,
  message text not null,
  created_at timestamptz not null default now()
);
