import type { Difficulty, Ingredient, Recipe, Step } from "@/lib/db/schema";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function totalTime(r: { prepTime: number; cookTime: number }): number {
  return (r.prepTime || 0) + (r.cookTime || 0);
}

/**
 * Returns the recipe's steps. New recipes store a real `steps[]` array; older
 * recipes only have the legacy `instructions` string — for those we split the
 * paragraph into steps on the fly so the recipe page still renders a numbered
 * method. The original `instructions` is never destroyed.
 */
export function getSteps(recipe: Pick<Recipe, "steps" | "instructions">): Step[] {
  if (recipe.steps && recipe.steps.length > 0) return recipe.steps;

  const raw = (recipe.instructions || "").trim();
  if (!raw) return [];

  const parts = raw.includes("\n")
    ? raw.split(/\n+/)
    : raw.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);

  return parts
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text) => ({ text }));
}

/** Join steps back into a single string for the legacy `instructions` column. */
export function stepsToInstructions(steps: Step[]): string {
  return steps
    .map((s) => s.text.trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * A recipe is "sparse" when it predates the richer fields — used to show a
 * gentle "complete with AI" nudge. Never blocks anything.
 */
export function isSparse(r: Pick<Recipe, "description" | "servings" | "difficulty">): boolean {
  return !r.description || r.servings == null || !r.difficulty;
}

export function formatAmount(ing: Ingredient): string {
  return [ing.amount, ing.unit].filter(Boolean).join(" ").trim();
}

/**
 * Scales a numeric ingredient amount by a factor (for the servings stepper).
 * Leaves non-numeric amounts (e.g. "a pinch") untouched.
 */
export function scaleAmount(amount: string, factor: number): string {
  const trimmed = amount.trim();
  if (!trimmed) return amount;
  // handle simple fractions like "1/2"
  const frac = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  let value: number | null = null;
  if (frac) value = parseInt(frac[1], 10) / parseInt(frac[2], 10);
  else if (/^\d*\.?\d+$/.test(trimmed)) value = parseFloat(trimmed);
  if (value == null || isNaN(value)) return amount;

  const scaled = value * factor;
  // round to a clean 2-decimal max, strip trailing zeros
  return parseFloat(scaled.toFixed(2)).toString();
}
