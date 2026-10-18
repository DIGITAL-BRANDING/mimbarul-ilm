# Mimbarul Ilm - Islamic scholar & author platform

Next.js 16 + Supabase. Status and roadmap: [docs/PROGRESS.md](docs/PROGRESS.md).

## Local setup
```bash
cp .env.example .env.local      # fill in your Supabase values
npm install
# apply supabase/migrations/*.sql in order (SQL editor or `supabase db push`)
npm run dev                     # http://localhost:3000  (redirects to /ha)
```
Provision the first admin: [docs/ADMIN_PROVISIONING.md](docs/ADMIN_PROVISIONING.md).

## Checks
`npm run typecheck && npm run lint && npm test` - and `npm run test:db` (needs a local PostgreSQL 15+ with `PG*` env vars set).
