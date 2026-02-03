# Origo — AI-Powered Creative Brief Platform

A full-stack SaaS application that lets agencies, freelancers and entrepreneurs generate structured project briefs in seconds.

## Overview

Origo streamlines the brief creation process by combining a clean multi-step form with an AI generation pipeline. Users get a detailed, export-ready brief — presentation, MVP scope, technical spec or quote — in under a minute.

Built as a personal project to learn full-stack development with modern tooling: Next.js App Router, Supabase, Stripe and Clerk.

## Features

- **Brief generation** — structured output from a single prompt (Présentation / MVP / POC / Devis)
- **PDF export** — multiple themes (classic, minimal, dark, executive, emerald), plan-gated
- **Folder system** — Mac Finder-style brief organisation with color-coded folders
- **Subscription tiers** — Free / Starter / Pro / Premium via Stripe Checkout
- **Credit packs** — one-off credit purchases (5, 10, 25, 50, 100 credits)
- **Activation codes** — collector edition unlock system (e.g. limited early-access codes)
- **7 languages** — EN, FR, DE, ES, IT, RU, ZH via next-intl
- **Telegram bot** — `/status`, `/briefs`, `/usage` commands for monitoring

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 |
| Auth | Clerk |
| Database | Supabase (PostgreSQL + RLS) |
| Payments | Stripe Checkout + Webhooks |
| AI | Anthropic API (multi-agent dispatch by plan) |
| Email | Clerk |
| Monitoring | Sentry + PostHog |
| i18n | next-intl (ICU MessageFormat) |
| Testing | Jest + Playwright |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # i18n routing (landing, dashboard, auth pages)
│   └── api/               # Route handlers (generate, checkout, webhooks...)
├── components/            # Shared UI components
├── lib/
│   ├── repositories/      # Data access layer (briefs, folders, features...)
│   ├── supabase/          # Supabase clients (server, client, clerk-authenticated)
│   └── multi-agent.ts     # AI dispatch logic (Free→Haiku, Pro→parallel, Premium→Sonnet)
migrations/                # SQL migrations (run in order)
e2e/                       # Playwright end-to-end tests
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: Supabase URL/keys, Clerk keys, Stripe keys, Anthropic API key

# Run database migrations in Supabase dashboard (migrations/ folder, in order)

# Start dev server
npm run dev
```

## Environment Variables

See `.env.example` for the full list. Required:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ANTHROPIC_API_KEY=
```

## Database

Supabase PostgreSQL with Row Level Security. Run migrations in order:

```
migrations/
├── 001_initial_schema.sql
├── 002_phase2_skin_system.sql
├── 003_logo_storage.sql
└── 004_clerk_auth_migration.sql
```

## Testing

```bash
npm test           # Jest unit tests
npm run test:e2e   # Playwright E2E tests
```

## Deployment

Deployed on Vercel. Push to `main` triggers production deploy.

Clerk production instance required with:
- JWT template named `supabase` (signed with Supabase JWT secret)
- Custom domain configured

## License

MIT
