import Link from "next/link";
import Image from "next/image";
import { Star, Clock, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Recipe, DishType } from "@/lib/db/schema";

const DISH_TYPE_COLORS: Record<DishType, string> = {
  lunch: "bg-emerald-100 text-emerald-700 border-emerald-200",
  dinner: "bg-blue-100 text-blue-700 border-blue-200",
  breakfast: "bg-yellow-100 text-yellow-700 border-yellow-200",
  side: "bg-zinc-100 text-zinc-700 border-zinc-200",
  appetizer: "bg-purple-100 text-purple-700 border-purple-200",
  snack: "bg-orange-100 text-orange-700 border-orange-200",
  sauce: "bg-red-100 text-red-700 border-red-200",
  drinks: "bg-cyan-100 text-cyan-700 border-cyan-200",
  vegan: "bg-green-100 text-green-700 border-green-200",
};

type RecipeCardProps = {
  recipe: Recipe;
  selected?: boolean;
  onSelect?: (id: string) => void;
};

export function RecipeCard({ recipe, selected, onSelect }: RecipeCardProps) {
  return (
    <div className="group relative">
      {/* Selection checkbox */}
      {onSelect && (
        <button
          type="button"
          aria-label={selected ? "Deselect recipe" : "Select recipe"}
          className={cn(
            "absolute top-2 left-2 z-10 h-5 w-5 rounded-full border-2 bg-white transition-all",
            selected
              ? "border-primary bg-primary opacity-100"
              : "border-zinc-300 opacity-0 group-hover:opacity-100"
          )}
          onClick={() => onSelect(recipe.id)}
        >
          {selected && (
            <svg
              className="h-full w-full p-0.5 text-white"
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
        href={`/recipe/${recipe.id}`}
        className={cn(
          "block overflow-hidden rounded-xl border transition-all duration-200",
          "hover:-translate-y-0.5 hover:shadow-md",
          selected ? "ring-primary border-primary ring-2" : "border-zinc-200"
        )}
      >
        {/* ── Mobile: full-bleed image card ── */}
        <div className="relative sm:hidden">
          <div className="relative aspect-[4/3] w-full bg-zinc-100">
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              fill
              className="object-cover"
              sizes="100vw"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>

          {/* Rating — top right */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-white">
              {recipe.rating.toFixed(1)}
            </span>
          </div>

          {/* Title + times — bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
            <p className="line-clamp-2 text-sm font-bold leading-tight text-white">
              {recipe.name}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-white/80">
              <span className="flex items-center gap-1">
                <Utensils size={11} />
                {recipe.prepTime} min prep
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {recipe.cookTime} min cook
              </span>
            </div>
          </div>
        </div>

        {/* ── Desktop: classic card with image + body ── */}
        <div className="hidden sm:block bg-white">
          <div className="relative aspect-[4/3] w-full bg-zinc-100">
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 33vw"
            />
          </div>

          <div className="space-y-2 p-3">
            <h3 className="line-clamp-2 text-sm leading-tight font-semibold text-zinc-900">
              {recipe.name}
            </h3>

            <div className="flex items-center justify-between gap-2">
              {recipe.dishTypes[0] && (
                <Badge
                  className={cn(
                    "border text-xs capitalize",
                    DISH_TYPE_COLORS[recipe.dishTypes[0] as DishType]
                  )}
                  variant="outline"
                >
                  {recipe.dishTypes[0]}
                </Badge>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium text-zinc-600">
                  {recipe.rating.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Utensils size={12} />
                {recipe.prepTime} min prep
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {recipe.cookTime} min cook
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
