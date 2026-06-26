import Link from "next/link";
import Image from "next/image";
import { Clock, Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS, totalTime } from "@/lib/recipe-utils";
import type { Recipe, DishType } from "@/lib/db/schema";

const DISH_TYPE_COLORS: Record<DishType, string> = {
  lunch: "bg-emerald-500/90",
  dinner: "bg-indigo-500/90",
  breakfast: "bg-amber-500/90",
  side: "bg-zinc-500/90",
  appetizer: "bg-purple-500/90",
  snack: "bg-orange-500/90",
  sauce: "bg-rose-500/90",
  drinks: "bg-cyan-500/90",
  vegan: "bg-green-600/90",
};

type RecipeCardProps = {
  recipe: Recipe;
  selected?: boolean;
  onSelect?: (id: string) => void;
  linkPrefix?: string;
};

export function RecipeCard({ recipe, selected, onSelect, linkPrefix = "/recipe" }: RecipeCardProps) {
  // Build the sub-line from whatever exists — never render "null"/empty.
  const subBits: string[] = [];
  if (recipe.difficulty) subBits.push(DIFFICULTY_LABELS[recipe.difficulty]);
  if (recipe.servings) subBits.push(`${recipe.servings} servings`);
  if (subBits.length === 0) subBits.push(`${totalTime(recipe)} min total`);

  const cat = recipe.dishTypes[0] as DishType | undefined;

  return (
    <div className="group relative">
      {/* Selection checkbox */}
      {onSelect && (
        <button
          type="button"
          aria-label={selected ? "Deselect recipe" : "Select recipe"}
          className={cn(
            "absolute top-2.5 left-2.5 z-10 h-6 w-6 rounded-full border-2 bg-white/90 backdrop-blur transition-all",
            selected
              ? "border-primary bg-primary opacity-100"
              : "border-white/80 opacity-0 group-hover:opacity-100"
          )}
          onClick={() => onSelect(recipe.id)}
        >
          {selected && (
            <svg
              className="h-full w-full p-1 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      )}

      <Link
        href={`${linkPrefix}/${recipe.id}`}
        className={cn(
          "block overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200",
          "hover:-translate-y-1 hover:shadow-xl hover:ring-zinc-200",
          selected ? "ring-primary ring-2" : "ring-1 ring-zinc-100"
        )}
      >
        {/* Image */}
        <div className="relative aspect-square w-full bg-zinc-100">
          <Image
            src={recipe.imageUrl}
            alt={recipe.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Bottom scrim keeps the time pill legible on bright photos */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />

          {/* Category chip */}
          {cat && (
            <span
              className={cn(
                "absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white capitalize shadow-sm backdrop-blur-sm",
                DISH_TYPE_COLORS[cat] ?? "bg-zinc-600/90"
              )}
            >
              {cat}
            </span>
          )}

          {/* Heart */}
          <span className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-zinc-500 shadow-sm backdrop-blur-sm transition-colors group-hover:text-rose-500">
            <Heart size={15} />
          </span>

          {/* Total-time pill */}
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-zinc-800 shadow-sm backdrop-blur-sm">
            <Clock size={11} />
            {totalTime(recipe)} min
          </span>
        </div>

        {/* Body */}
        <div className="p-3.5">
          <h3 className="font-display line-clamp-2 min-h-[2.5em] text-[15px] leading-tight font-bold tracking-tight text-zinc-900">
            {recipe.name}
          </h3>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-zinc-500">{subBits.join(" · ")}</span>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-600">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {recipe.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
