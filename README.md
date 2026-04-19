# Party OS

Party OS is a React + Vite event operations app with Supabase-backed authentication.

## Local setup

1. Create `D:\partyOS\party-script\.env` with:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

2. Run the SQL in [supabase/profiles.sql](D:\partyOS\party-script\supabase\profiles.sql) in the Supabase SQL editor.
3. Run the SQL in [supabase/events.sql](D:\partyOS\party-script\supabase\events.sql) in the Supabase SQL editor.
4. Make sure each signed-in user has a row in `public.profiles`.
5. Start the app with `npm run dev`.

## Profiles contract

The frontend now reads authorization data from `public.profiles`, not from Auth metadata.

Auth flow:

- Supabase Auth creates and restores the session
- the app loads the matching row from `public.profiles`
- if the profile is missing, login fails with an explicit error

Required columns:

- `id uuid primary key references auth.users(id)`
- `role text not null default 'manager'`
- `organization_id text not null default 'org-party'`
- `full_name text`

The included SQL file also:

- auto-creates a profile row when a new Auth user is created
- enables RLS
- lets users read their own profile
- lets users update their own display fields without changing `role` or `organization_id`

## Events contract

Event data is now fetched from `public.events` through `EventContext`.

Current implementation:

- fetches all events for the signed-in user's organization
- filters manager visibility in the app using `owner_id` and `manager_ids`
- inserts newly created events into `public.events`
- keeps nested contacts/vendors/tasks/documents/activities in jsonb columns for now
