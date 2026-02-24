# My Recipe App

A personal recipe library to save, organize, and browse your favorite home-cooked meals. Upload a photo, add ingredients and instructions, tag by dish type, and organize recipes into folders — all through a clean, Pinterest-style grid.

**Live demo:** visitors can browse recipes without creating an account.

## Features

- **Recipe grid** — Pinterest-style layout with hero images, dish type badges, star ratings, prep & cook times
- **Recipe detail** — full page with ingredients, instructions, and metadata
- **Add & edit recipes** — upload a photo, fill in details, save via server action
- **Folders** — organize recipes into flat folders, move multiple at once
- **Multi-select** — select several recipe cards and batch-move them
- **Search & filter** — filter the grid by folder or dish type
- **Public demo mode** — portfolio visitors can browse your real recipes read-only at `/demo`
- **PWA support** — installable on mobile with an install banner prompt
- **Dark mode** — system-aware theme switching

## Tech Stack

| Concern          | Tool                          |
| ---------------- | ----------------------------- |
| Framework        | Next.js 16 (App Router)      |
| Styling          | Tailwind CSS v4 + shadcn/ui  |
| Database         | Neon Postgres + Drizzle ORM   |
| Auth             | Clerk (GitHub, Google, Apple) |
| File Upload      | Uploadthing                   |
| Error Monitoring | Sentry                        |
| Analytics        | PostHog                        |
| Rate Limiting    | Upstash Redis                  |
| Deployment       | Vercel                         |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Install & run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` (or create `.env.local`) and fill in:

```
POSTGRES_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
DEMO_CLERK_ID=              # your Clerk user ID — enables public demo mode
```

### Database

```bash
pnpm db:push      # push Drizzle schema to your database
pnpm db:studio    # open Drizzle Studio GUI
```

## Project Structure

```
src/
├── app/            # Next.js App Router pages & layouts
├── components/     # React components (ui/ for shadcn)
├── hooks/          # Custom React hooks
├── lib/db/         # Drizzle client & schema
├── server/actions/ # Server actions (create, update, delete)
└── proxy.ts        # Clerk auth middleware
```

## License

Private project — not open for contributions.
