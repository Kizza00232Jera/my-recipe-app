"use server";

import * as Sentry from "@sentry/nextjs";
import { fetchPageContent } from "@/lib/ai/extract";
import { callLLM, extractJson, generatedImageUrl, searchUnsplash } from "@/lib/ai/providers";
import { modelLabel, type ProviderId } from "@/lib/ai/models";
import { assertQuota, getAllQuotas, recordUsage } from "@/lib/ai/quota";
import { DISH_TYPES, DIFFICULTIES } from "@/lib/db/schema";
import type { DishType, Difficulty } from "@/lib/db/schema";
import type { Field, IdeasResult, ImportResult, ImportedRecipe, Provenance } from "@/lib/ai/types";

// AI runs on the SITE OWNER'S key, not the user's. Provider is fixed to Anthropic;
// the model is overridable via env. Usage is capped per user — see lib/ai/quota.ts.
const PROVIDER: ProviderId = "anthropic";

function serverModel(): string {
  return process.env.AI_MODEL || "claude-sonnet-4-6";
}

function serverKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key)
    throw new Error("AI isn't set up yet — the site owner needs to add an Anthropic API key.");
  return key;
}

/** Current AI allowances for the signed-in user (for rendering the counters). */
export async function getAiQuotas() {
  return getAllQuotas();
}

export type ImportInput = {
  mode: "link" | "text";
  content: string;
};

const SYSTEM = `You are a meticulous recipe parser. You convert a webpage or pasted text into a single structured recipe.

Return ONLY a JSON object (no markdown, no prose) with EXACTLY these keys:
{
  "name": {"value": string, "source": "source"|"ai"},
  "description": {"value": string, "source": "source"|"ai"},
  "dishTypes": {"value": string[], "source": "source"|"ai"},
  "cuisine": {"value": string, "source": "source"|"ai"},
  "tags": {"value": string[], "source": "source"|"ai"},
  "prepTime": {"value": number, "source": "source"|"ai"},
  "cookTime": {"value": number, "source": "source"|"ai"},
  "servings": {"value": number|null, "source": "source"|"ai"},
  "difficulty": {"value": "easy"|"medium"|"hard"|null, "source": "source"|"ai"},
  "calories": {"value": number|null, "source": "source"|"ai"},
  "ingredients": [{"amount": string, "unit": string, "name": string, "source": "source"|"ai"}],
  "steps": [{"text": string, "source": "source"|"ai", "note": string}]
}

RULES:
- "source" means the value is stated in the SOURCE. "ai" means YOU inferred or researched it.
- Fill EVERY field. If a fact is missing from the SOURCE, research a sensible value for THIS dish and mark it "source":"ai". For an AI value, add a short "note" explaining it (e.g. "typical bake temp for lava cake").
- Times are integers in MINUTES.
- ALL measurements MUST be METRIC / European: weights in g or kg, volumes in ml or l (or tsp/tbsp for small amounts), temperatures in °C. NEVER use cups, ounces (oz), pounds (lb), Fahrenheit (°F) or stick. If the SOURCE uses US units, CONVERT them to metric (e.g. 1 cup flour → 120 g, 1 cup liquid → 240 ml, 350°F → 175°C, 1 lb → 450 g). Put any temperature inside the step text in °C.
- "dishTypes" values MUST be from: ${DISH_TYPES.join(", ")}.
- "difficulty" MUST be exactly easy, medium, or hard (or null).
- Split the method into clear, individual numbered steps.
- Keep the description to one or two appetising sentences.
- Never invent ingredients that contradict the source; you may ADD an obviously-needed staple (e.g. salt) marked "source":"ai".`;

export async function importRecipe(input: ImportInput): Promise<ImportResult> {
  try {
    const user = await assertQuota("generate");

    let sourceLabel = "pasted text";
    let sourceBlock = input.content.trim();
    let sourceImage: string | null = null;

    if (input.mode === "link") {
      const page = await fetchPageContent(input.content.trim());
      sourceLabel = page.host;
      sourceImage = resolveJsonLdImage(page.jsonLd) ?? page.ogImage;
      sourceBlock = page.jsonLd
        ? `STRUCTURED RECIPE DATA (schema.org):\n${JSON.stringify(page.jsonLd).slice(0, 7000)}`
        : `PAGE TITLE: ${page.title}\n\nPAGE TEXT:\n${page.text}`;
    }

    if (!sourceBlock) throw new Error("There was nothing to import.");

    const model = serverModel();
    const raw = await callLLM({
      provider: PROVIDER,
      apiKey: serverKey(),
      model,
      system: SYSTEM,
      user: `SOURCE:\n${sourceBlock}`,
    });

    const parsed = extractJson<RawRecipe>(raw);
    const recipe = normalize(parsed);
    const image = await resolveCover(recipe, sourceImage);
    const quota = await recordUsage(user, "generate");

    return {
      recipe,
      image,
      sourceLabel,
      modelLabel: modelLabel(PROVIDER, model),
      quota,
    };
  } catch (err) {
    Sentry.captureException(err);
    throw err instanceof Error ? err : new Error("Import failed.");
  }
}

// ── AI recipe ideas (token-light: titles only) ─────────────────────────────

export type IdeasInput = {
  query: string;
  mealType?: string;
  simple?: boolean;
  exclude?: string[]; // titles already shown — return genuinely different dishes
};

const IDEAS_SYSTEM = `You suggest recipe ideas. Given a short request, return EXACTLY 3 distinct dish ideas that fit it.

Return ONLY JSON (no prose): {"ideas":[{"title": string, "blurb": string}]}.
- "title": a concise, appetising dish name (no brand names).
- "blurb": ONE short sentence, max 12 words.
- Honour the requested meal type, key ingredients, cuisine and complexity. If the user wants something simple, keep the ideas genuinely easy (few ingredients, common techniques).
- Make the three ideas meaningfully different from each other.
- Do NOT include ingredients, steps, times, or any other field. Titles and blurbs only.`;

export async function suggestRecipeIdeas(input: IdeasInput): Promise<IdeasResult> {
  try {
    if (!input.query.trim()) throw new Error("Tell me what you feel like cooking.");
    const user = await assertQuota("ideas");

    const constraints = [
      input.mealType ? `Meal type: ${input.mealType}.` : "",
      input.simple ? "Keep them simple and quick." : "",
    ]
      .filter(Boolean)
      .join(" ");

    const exclude = (input.exclude ?? [])
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(-18);
    const avoidBlock = exclude.length
      ? `\nDo NOT suggest these already-shown ideas, or anything close to them — return 3 GENUINELY DIFFERENT dishes (different main ingredient, cuisine or technique), while still matching the request: ${exclude.join("; ")}.`
      : "";

    const raw = await callLLM({
      provider: PROVIDER,
      apiKey: serverKey(),
      model: serverModel(),
      system: IDEAS_SYSTEM,
      user: `REQUEST: ${input.query.trim()}${constraints ? `\n${constraints}` : ""}${avoidBlock}`,
    });

    const parsed = extractJson<{ ideas?: { title?: string; blurb?: string }[] }>(raw);
    const ideas = (parsed.ideas ?? [])
      .filter((i) => (i.title ?? "").trim())
      .slice(0, 3)
      .map((i) => ({ title: String(i.title).trim(), blurb: String(i.blurb ?? "").trim() }));
    if (!ideas.length) throw new Error("No ideas came back — try rephrasing.");
    const quota = await recordUsage(user, "ideas");
    return { ideas, quota };
  } catch (err) {
    Sentry.captureException(err);
    throw err instanceof Error ? err : new Error("Couldn't get ideas.");
  }
}

// ── generate a full recipe from a chosen idea ──────────────────────────────

export type GenerateInput = {
  title: string;
  query?: string;
};

const GENERATE_SYSTEM = `You invent ONE complete, realistic, well-balanced recipe for the given dish title.

Return ONLY a JSON object (no prose) with EXACTLY these keys:
{
  "name": {"value": string, "source": "ai"},
  "description": {"value": string, "source": "ai"},
  "dishTypes": {"value": string[], "source": "ai"},
  "cuisine": {"value": string, "source": "ai"},
  "tags": {"value": string[], "source": "ai"},
  "prepTime": {"value": number, "source": "ai"},
  "cookTime": {"value": number, "source": "ai"},
  "servings": {"value": number, "source": "ai"},
  "difficulty": {"value": "easy"|"medium"|"hard", "source": "ai"},
  "calories": {"value": number, "source": "ai"},
  "ingredients": [{"amount": string, "unit": string, "name": string, "source": "ai"}],
  "steps": [{"text": string, "source": "ai"}]
}

RULES:
- This is an ORIGINAL recipe you create, so EVERY field is "source":"ai".
- Honour any extra request (key ingredients, cuisine, complexity). If a simple recipe was asked for, keep it simple.
- Times are integers in MINUTES. "dishTypes" MUST be from: ${DISH_TYPES.join(", ")}. "difficulty" MUST be easy, medium, or hard.
- ALL measurements MUST be METRIC / European: weights in g or kg, volumes in ml or l (or tsp/tbsp for small amounts), temperatures in °C. NEVER use cups, ounces (oz), pounds (lb), Fahrenheit (°F) or stick. Put any temperature inside the step text in °C.
- Split the method into clear, individual numbered steps. Keep the description to one or two appetising sentences.`;

export async function generateRecipe(input: GenerateInput): Promise<ImportResult> {
  try {
    if (!input.title.trim()) throw new Error("Pick an idea first.");
    const user = await assertQuota("generate");

    const model = serverModel();
    const raw = await callLLM({
      provider: PROVIDER,
      apiKey: serverKey(),
      model,
      system: GENERATE_SYSTEM,
      user: `DISH TITLE: ${input.title.trim()}${input.query?.trim() ? `\nORIGINAL REQUEST: ${input.query.trim()}` : ""}`,
    });

    const recipe = normalize(extractJson<RawRecipe>(raw));
    if (!recipe.name.value) recipe.name = { value: input.title.trim(), source: "ai" };
    const image = await resolveCover(recipe, null);
    const quota = await recordUsage(user, "generate");

    return {
      recipe,
      image,
      sourceLabel: "AI-generated",
      modelLabel: modelLabel(PROVIDER, model),
      quota,
    };
  } catch (err) {
    Sentry.captureException(err);
    throw err instanceof Error ? err : new Error("Couldn't generate the recipe.");
  }
}

// ── shared cover-image resolution ──────────────────────────────────────────
// Tiered so a recipe ALWAYS gets a usable cover:
//   1. the source page's own photo (best)
//   2. an Unsplash stock photo (owner's UNSPLASH_ACCESS_KEY, if set)
//   3. a keyless AI-generated photo (always works) — the user can replace it
async function resolveCover(
  recipe: ImportedRecipe,
  sourceImage: string | null
): Promise<ImportResult["image"]> {
  if (sourceImage) return { url: sourceImage, source: "source" };
  const query =
    [recipe.name.value, recipe.cuisine.value].filter(Boolean).join(" ").trim() ||
    recipe.name.value ||
    "food";
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || "";
  const stock = unsplashKey ? await searchUnsplash(query, unsplashKey) : null;
  return stock
    ? { url: stock, source: "ai", query }
    : { url: generatedImageUrl(query), source: "ai", query };
}

// ── normalisation ─────────────────────────────────────────────────────────

type RawField<T> = { value?: T; source?: string; note?: string } | T | undefined;
type RawRecipe = {
  name?: RawField<string>;
  description?: RawField<string>;
  dishTypes?: RawField<string[]>;
  cuisine?: RawField<string>;
  tags?: RawField<string[]>;
  prepTime?: RawField<number>;
  cookTime?: RawField<number>;
  servings?: RawField<number | null>;
  difficulty?: RawField<string | null>;
  calories?: RawField<number | null>;
  ingredients?: { amount?: string; unit?: string; name?: string; source?: string }[];
  steps?: ({ text?: string; source?: string; note?: string } | string)[];
};

function prov(s: unknown): Provenance {
  return s === "ai" ? "ai" : "source";
}

function field<T>(raw: RawField<T>, fallback: T): Field<T> {
  if (raw && typeof raw === "object" && "value" in raw) {
    const r = raw as { value?: T; source?: string; note?: string };
    return { value: (r.value ?? fallback) as T, source: prov(r.source), note: r.note };
  }
  return { value: (raw ?? fallback) as T, source: "source" };
}

function toInt(v: unknown): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return isNaN(n) ? 0 : n;
}

function toIntOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return isNaN(n) ? null : n;
}

function normalize(r: RawRecipe): ImportedRecipe {
  const dishRaw = field<string[]>(r.dishTypes, []);
  const dishTypes: DishType[] = (dishRaw.value ?? [])
    .map((d) => String(d).toLowerCase())
    .filter((d): d is DishType => (DISH_TYPES as readonly string[]).includes(d));

  const diffRaw = field<string | null>(r.difficulty, null);
  const diffVal = diffRaw.value ? String(diffRaw.value).toLowerCase() : null;
  const difficulty: Difficulty | null = (DIFFICULTIES as readonly string[]).includes(diffVal ?? "")
    ? (diffVal as Difficulty)
    : null;

  const prep = field<number>(r.prepTime, 0);
  const cook = field<number>(r.cookTime, 0);
  const serv = field<number | null>(r.servings, null);
  const cal = field<number | null>(r.calories, null);

  return {
    name: field<string>(r.name, "Untitled recipe"),
    description: field<string>(r.description, ""),
    dishTypes: { value: dishTypes, source: dishRaw.source },
    cuisine: field<string>(r.cuisine, ""),
    tags: field<string[]>(r.tags, []),
    prepTime: { value: toInt(prep.value), source: prep.source },
    cookTime: { value: toInt(cook.value), source: cook.source },
    servings: { value: toIntOrNull(serv.value), source: serv.source },
    difficulty: { value: difficulty, source: diffRaw.source },
    calories: { value: toIntOrNull(cal.value), source: cal.source },
    ingredients: (r.ingredients ?? [])
      .filter((i) => i && (i.name ?? "").trim())
      .map((i) => ({
        value: {
          amount: String(i.amount ?? "").trim(),
          unit: String(i.unit ?? "").trim(),
          name: String(i.name ?? "").trim(),
        },
        source: prov(i.source),
      })),
    steps: (r.steps ?? [])
      .map((s) =>
        typeof s === "string"
          ? { value: { text: s.trim() }, source: "source" as Provenance }
          : {
              value: { text: String(s.text ?? "").trim() },
              source: prov(s.source),
              note: s.note,
            }
      )
      .filter((s) => s.value.text),
  };
}

function resolveJsonLdImage(jsonLd: unknown): string | null {
  if (!jsonLd || typeof jsonLd !== "object") return null;
  const img = (jsonLd as Record<string, unknown>).image;
  if (!img) return null;
  if (typeof img === "string") return img;
  if (Array.isArray(img)) {
    const first = img[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first)
      return String((first as Record<string, unknown>).url);
  }
  if (typeof img === "object" && "url" in img)
    return String((img as Record<string, unknown>).url);
  return null;
}
