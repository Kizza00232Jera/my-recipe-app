-- Foodie redesign — additive migration. SAFE: only ADDs columns (nullable or
-- with defaults) and a default on `instructions`. No columns are dropped and no
-- existing data is modified, so all current recipes stay valid.
--
-- Apply with either:
--   pnpm db:push            (drizzle-kit reads schema.ts; review + confirm)
-- or run this SQL directly against your Neon database.

ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "image_urls" text[] NOT NULL DEFAULT '{}';
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "steps" json NOT NULL DEFAULT '[]'::json;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "description" text NOT NULL DEFAULT '';
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "servings" integer;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "difficulty" text;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "cuisine" text NOT NULL DEFAULT '';
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "calories" integer;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT '';

-- instructions kept as a fallback; give it a default so it's no longer required
ALTER TABLE "recipes" ALTER COLUMN "instructions" SET DEFAULT '';
