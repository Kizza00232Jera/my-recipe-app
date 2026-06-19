import type { ReactNode } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { DIFFICULTY_LABELS, getSteps, totalTime } from "@/lib/recipe-utils";
import { RecipeMethod } from "@/components/recipe-method";
import type { Recipe } from "@/lib/db/schema";

export function RecipeDetail({
  recipe,
  enhanceSlot,
}: {
  recipe: Recipe;
  enhanceSlot?: ReactNode;
}) {
  const steps = getSteps(recipe);

  // Only build tiles for facts that actually have a value.
  const facts: { k: string; v: string }[] = [];
  if (recipe.prepTime != null) facts.push({ k: "Prep", v: `${recipe.prepTime}m` });
  if (recipe.cookTime != null) facts.push({ k: "Cook", v: `${recipe.cookTime}m` });
  if (recipe.servings) facts.push({ k: "Serves", v: `${recipe.servings}` });
  if (recipe.difficulty) facts.push({ k: "Level", v: DIFFICULTY_LABELS[recipe.difficulty] });
  if (recipe.calories) facts.push({ k: "kcal", v: `${recipe.calories}` });
  const shownFacts = facts.slice(0, 5);

  const cat = recipe.dishTypes[0];

  return (
    <div>
      {/* Hero */}
      <div className="relative aspect-[16/11] w-full overflow-hidden rounded-3xl bg-zinc-900">
        <Image
          src={recipe.imageUrl}
          alt={recipe.name}
          fill
          className="object-cover opacity-90"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 p-5 sm:p-7">
          {cat && (
            <span className="bg-primary inline-block rounded-full px-3 py-1 text-xs font-bold text-white capitalize">
              {cat}
            </span>
          )}
          <h1 className="font-display mt-2.5 text-2xl leading-tight font-bold text-white sm:text-3xl">
            {recipe.name}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-white/85">
            <span className="flex items-center gap-1 font-semibold">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {recipe.rating.toFixed(1)}
            </span>
            <span>·</span>
            <span>{totalTime(recipe)} min total</span>
            {recipe.cuisine && (
              <>
                <span>·</span>
                <span>{recipe.cuisine}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {recipe.description && (
        <p className="mt-5 text-base leading-relaxed text-zinc-600">{recipe.description}</p>
      )}

      {/* Quick facts */}
      {shownFacts.length > 0 && (
        <div
          className="mt-5 grid gap-2.5"
          style={{ gridTemplateColumns: `repeat(${Math.min(shownFacts.length, 5)}, minmax(0,1fr))` }}
        >
          {shownFacts.map((f) => (
            <div
              key={f.k}
              className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-zinc-100"
            >
              <div className="font-display text-lg font-bold text-zinc-900">{f.v}</div>
              <div className="mt-0.5 text-[11px] text-zinc-400">{f.k}</div>
            </div>
          ))}
        </div>
      )}

      {/* AI enhance nudge (for sparse recipes) */}
      {enhanceSlot && <div className="mt-5">{enhanceSlot}</div>}

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Ingredients + Method */}
      <div className="mt-7">
        <RecipeMethod
          ingredients={recipe.ingredients}
          steps={steps}
          baseServings={recipe.servings}
        />
      </div>

      {/* Source */}
      {recipe.source && (
        <p className="mt-7 text-sm text-zinc-400">
          Source: <span className="font-medium text-zinc-600">{recipe.source}</span>
        </p>
      )}
    </div>
  );
}
