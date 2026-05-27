# skipQ

Live queue and booking platform for salons. Skip the wait. See live queues. Book from anywhere.

The full product, technical, and business specification lives in [`CLAUDE.md`](./CLAUDE.md).

## Repo layout

```
skipq/
├── apps/
│   ├── customer-mobile/   React Native + Expo
│   └── partner-web/       Next.js 14 — salon dashboard + skipQ admin
├── packages/
│   ├── shared-types/      TypeScript types shared across apps
│   └── api-client/        Supabase client wrapper
└── supabase/
    ├── migrations/        SQL migrations (numbered)
    ├── functions/         Edge functions (Deno)
    ├── seed.sql           Development seed data
    └── config.toml        Supabase CLI config
```

## Prerequisites

- Node.js >= 22
- pnpm >= 10
- Supabase CLI (`npm install -g supabase`)
- (mobile) Expo CLI via `pnpm dlx expo`

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in keys
pnpm dev                     # runs all apps via turbo
```

## Conventions

- **TypeScript everywhere.** Generate Supabase types after schema changes (`pnpm --filter @skipq/shared-types gen`).
- **Mobile-first** for the partner web dashboard — salons use phones.
- **No `service_role` key on the client.** Server-only secrets stay in edge functions.
- Migrations are append-only and numbered (`0001_*.sql`, `0002_*.sql`...).
