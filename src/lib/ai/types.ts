import type { Difficulty, DishType, Ingredient, Step } from "@/lib/db/schema";

// Where a value came from: "source" = read from the user's link/text;
// "ai" = inferred or researched by the model.
export type Provenance = "source" | "ai";

export type Field<T> = { value: T; source: Provenance; note?: string };

export type ImportedRecipe = {
  name: Field<string>;
  description: Field<string>;
  dishTypes: Field<DishType[]>;
  cuisine: Field<string>;
  tags: Field<string[]>;
  prepTime: Field<number>;
  cookTime: Field<number>;
  servings: Field<number | null>;
  difficulty: Field<Difficulty | null>;
  calories: Field<number | null>;
  ingredients: { value: Ingredient; source: Provenance }[];
  steps: { value: Step; source: Provenance; note?: string }[];
};

export type ImportResult = {
  recipe: ImportedRecipe;
  image: { url: string | null; source: Provenance | "none"; query?: string };
  sourceLabel: string;
  modelLabel: string;
  quota: QuotaStatus;
};

// ── Daily AI quota (owner-funded; per user, per kind, resets daily) ──────────
export type QuotaKind = "ideas" | "generate";
export type QuotaStatus = {
  kind: QuotaKind;
  limit: number;
  used: number;
  remaining: number;
  unlimited: boolean; // true for the owner account — no limit applies
  resetsAt: string; // ISO timestamp of the next daily reset
};

// Token-light AI idea suggestions (titles + one-line blurbs only).
export type RecipeIdea = { title: string; blurb: string };
export type IdeasResult = { ideas: RecipeIdea[]; quota: QuotaStatus };

// Flat values handed off to the editor form once the user accepts the import.
export type ImportDraft = {
  name: string;
  description: string;
  dishTypes: DishType[];
  cuisine: string;
  tags: string[];
  prepTime: number;
  cookTime: number;
  servings: number | null;
  difficulty: Difficulty | null;
  calories: number | null;
  ingredients: Ingredient[];
  steps: Step[];
  imageUrl: string;
};
