# Party Script Console

Production-style Event OS for hosted events, exhibitions, booths, budgets, vendors, tasks, and lead follow-up.

## Stack

- React + TypeScript + Tailwind
- Vercel API routes
- JWT auth
- Supabase/Postgres-ready persistence with seeded fallback

## Local Run

```bash
npm install
npm run api
npm run dev
```

Frontend login:

- `founder@partyscript.app`
- `partyscript123`

## Persistence Modes

- `seed`: default fallback when Supabase env vars are not configured
- `supabase`: enabled when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present

The production API reads from Supabase automatically once those environment variables are set.

## Supabase Setup

1. Create a Supabase project.
2. Run [supabase/schema.sql](/C:/Users/susha/Documents/Codex/2026-04-23-we-will-work-on-our-actual/supabase/schema.sql).
3. Add the values from [.env.example](/C:/Users/susha/Documents/Codex/2026-04-23-we-will-work-on-our-actual/.env.example) to local env and Vercel project env.
4. Redeploy.

## GitHub Push

This workspace is now ready for git initialization and push, but the final push still needs:

- a GitHub repository URL
- authentication to that repo

## Custom Domain

The Vercel deployment is ready for a custom domain once you provide:

- the exact domain name
- access to the Vercel project/domain configuration
