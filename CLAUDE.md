# CLAUDE.md — My Recipe App

This file is the source of truth for Claude when working on this project. Always read this before making any changes.

---

## Project Overview

A personal recipe library web app. The user can upload photos of cooked meals, add recipe metadata, organize recipes into folders, and manage everything through a clean Pinterest-style grid UI.

---

## Todo (follow this order strictly)

- [ ] 1. Deploy to Vercel (connect repo, confirm CI works)
- [ ] 2. Scaffold basic UI with mock recipe data (grid layout)
- [ ] 3. Tidy up build process (ESLint, Prettier, path aliases)
- [ ] 4. Set up database (Vercel Postgres + Drizzle ORM)
- [ ] 5. Attach database to UI (replace mock data with real queries)
- [ ] 6. Add authentication (Clerk — GitHub + Google)
- [ ] 7. Add recipe upload (Uploadthing + server action to save)
- [ ] 8. Taint server-only modules (server-only package)
- [ ] 9. Use next/image component (replace img tags)
- [ ] 10. Error management (Sentry)
- [ ] 11. Recipe page routing (parallel + intercepting routes)
- [ ] 12. Polish upload button UI
- [ ] 13. Toaster notifications (shadcn/ui toast)
- [ ] 14. Analytics (PostHog)
- [ ] 15. Delete recipe (server action + confirm dialog)
- [ ] 16. Rate limiting (Upstash Redis)

---

## Tech Stack

| Concern          | Tool                               | Notes                                      |
| ---------------- | ---------------------------------- | ------------------------------------------ |
| Framework        | Next.js 14+ (App Router)           | Use server components by default           |
| Styling          | Tailwind CSS + shadcn/ui           | Use shadcn components wherever possible    |
| Icons            | Lucide React                       | Already included with shadcn               |
| Database         | Vercel Postgres + Drizzle ORM      | Use Drizzle for all queries, never raw SQL |
| Auth             | Clerk                              | GitHub + Google OAuth                      |
| File Upload      | Uploadthing                        | One hero image per recipe                  |
| Error Monitoring | Sentry                             | Wrap server actions and API routes         |
| Analytics        | PostHog                            | Client-side provider in layout             |
| Rate Limiting    | Upstash Redis + @upstash/ratelimit | Protect upload and delete endpoints        |
| Deployment       | Vercel                             | Auto-deploys on push to main               |
| Package Manager  | pnpm                               | Always use pnpm, never npm or yarn         |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — Clerk provider, PostHog, Toaster
│   ├── page.tsx                # Home page — recipe grid + folder sidebar
│   ├── @modal/                 # Parallel route for recipe modal
│   │   └── (.)recipe/[id]/
│   │       └── page.tsx
│   └── recipe/
│       └── [id]/
│           └── page.tsx        # Standalone recipe page (direct URL)
├── components/
│   ├── ui/                     # shadcn/ui auto-generated components
│   ├── recipe-card.tsx
│   ├── recipe-grid.tsx
│   ├── recipe-upload-button.tsx
│   ├── folder-sidebar.tsx
│   └── delete-recipe-button.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts            # Drizzle client (server-only)
│   │   └── schema.ts           # Drizzle schema definitions
│   ├── uploadthing.ts
│   └── utils.ts                # shadcn cn() utility
├── server/
│   └── actions/
│       ├── recipes.ts          # create, delete recipe server actions
│       └── folders.ts          # create, delete folder server actions
└── proxy.ts                    # Clerk auth proxy (Next.js 16 convention)
```

---

## Data Model

### Recipe

```ts
{
  id: string (cuid)
  userId: string              // from Clerk
  folderIds: string[]         // a recipe can live in multiple folders
  name: string
  imageUrl: string            // cover, from Uploadthing
  imageUrls: string[]         // extra gallery photos (optional)
  dishTypes: DishType[]       // 'lunch'|'dinner'|'breakfast'|'side'|'appetizer'|'snack'|'sauce'|'drinks'|'vegan'
  tags: string[]              // freeform e.g. ['chicken', 'spicy', 'quick']
  prepTime: number            // minutes
  cookTime: number            // minutes
  ingredients: json           // { amount, unit, name, group? }[]
  instructions: string        // LEGACY fallback — kept; new recipes use steps[]
  steps: json                 // { text: string, imageUrl?: string }[]
  rating: number              // 0–5
  // Foodie-redesign fields (all optional / defaulted — old recipes stay valid):
  description: string         // one-line hook
  servings: number | null
  difficulty: 'easy'|'medium'|'hard' | null
  cuisine: string
  calories: number | null
  source: string
  createdAt: timestamp
}
```

> Rendering rule: missing optional fields must COLLAPSE, never show "null"/empty.
> See `src/lib/recipe-utils.ts` (`getSteps` falls back from `instructions`,
> `isSparse` drives the "Complete with AI" nudge).

### AI create (owner-funded, daily quota)

`Create with AI` (in the upload dialog) → `RecipeImportPanel` → the `suggestRecipeIdeas`
/ `importRecipe` / `generateRecipe` server actions in `src/server/actions/import.ts`.

AI runs on the **site owner's** Anthropic key (`ANTHROPIC_API_KEY`), fixed to
Anthropic (model via `AI_MODEL`, default `claude-sonnet-4-6`). Users no longer
bring their own key — the old BYOK `localStorage` flow is gone.

Each signed-in user gets **two independent daily allowances** (`AI_DAILY_LIMIT`,
default 5 each), enforced server-side in `src/lib/ai/quota.ts`:

- `ideas` — `suggestRecipeIdeas` ("Get 3 ideas").
- `generate` — `importRecipe` (link/text import & "Complete with AI") **and**
  `generateRecipe` (generate from a picked idea).

Manual recipe creation is unlimited. Accounts in `AI_OWNER_EMAILS` (default
`antonio.jera10@gmail.com,ivanajerkovic52@gmail.com`) are unlimited on both.
All AI recipes use **metric / European units** (g, kg, ml, l, °C — never US units).
Counters reset at UTC midnight.
Storage uses Upstash Redis when configured, else an in-memory dev fallback.
Quota is asserted before the AI call and only consumed on success (a failed call
doesn't burn a credit). Optional `UNSPLASH_ACCESS_KEY` enables stock cover images.

### Folder

```ts
{
  id: string(cuid);
  userId: string;
  name: string;
  createdAt: timestamp;
}
```

### User

```ts
{
  id: string(cuid);
  clerkId: string;
  email: string;
  createdAt: timestamp;
}
```

---

## Key Rules — Always Follow These

### General

- Always use **pnpm** — never suggest npm or yarn commands
- Always use the **App Router** — never use pages/ directory patterns
- Default to **server components** — only add `"use client"` when strictly necessary (event handlers, hooks, browser APIs)
- All database access must go through **Drizzle** — never use raw SQL or direct postgres queries in components
- Never put database imports in client components — use the `server-only` package to enforce this

### Components

- Use **shadcn/ui** components before building custom ones
- Use **Lucide React** for all icons
- Recipe cards show: hero image, name, dish type badge, star rating, cook time
- The recipe modal uses a **parallel + intercepting route** pattern (not a state-based modal)

### Server Actions

- All mutations (create recipe, delete recipe, create folder, move recipe) must be **server actions** in `src/server/actions/`
- Wrap upload and delete actions with **Upstash rate limiting**
- Wrap server actions with **Sentry** error capturing

### Auth

- All pages require authentication — use Clerk middleware to protect everything except `/` (public landing) if needed
- Use `auth()` from `@clerk/nextjs/server` in server components
- Use `useAuth()` or `useUser()` from `@clerk/nextjs` in client components only

### Images

- Always use **next/image** — never a raw `<img>` tag
- Images are served from Uploadthing CDN — add their domain to `next.config.ts` remotePatterns

### Error Handling

- Sentry must be initialized in `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`
- Use `Sentry.captureException()` in catch blocks inside server actions

---

## Environment Variables

```bash
# Database
POSTGRES_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Uploadthing
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=

# AI (owner-funded recipe ideas & generation)
ANTHROPIC_API_KEY=
AI_MODEL=claude-sonnet-4-6           # optional
AI_OWNER_EMAILS=antonio.jera10@gmail.com  # unlimited accounts (comma-separated)
AI_DAILY_LIMIT=3                     # optional — per user/day, per kind
UNSPLASH_ACCESS_KEY=                 # optional — stock cover photos

# Sentry
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm db:push      # Push Drizzle schema to database
pnpm db:studio    # Open Drizzle Studio (database GUI)
```

Add these scripts to `package.json`:

```json
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

---

## UI Behaviour Notes

- **Home page**: Pinterest-style grid of recipe cards. Folder list shown above or in a sidebar. Clicking a folder filters the grid.
- **Recipe modal**: Clicking a card opens an intercepting route modal. The URL updates to `/recipe/[id]`. Refreshing the page loads the full standalone recipe page instead.
- **Upload**: Button opens a modal with image dropzone + all recipe fields. Submits via server action.
- **Multi-select**: User can select multiple recipe cards and move them to a folder via a "Move to folder" action bar that appears at the bottom.
- **Delete**: Only available on the full recipe page, at the bottom. Triggers a confirm dialog before firing the server action.
- **Folders**: Flat only — no nesting. User can create and delete folders.
