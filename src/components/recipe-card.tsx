import Image from "next/image";
import { Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Recipe, DishType } from "@/lib/mock-data";

const DISH_TYPE_COLORS: Record<DishType, string> = {
  main: "bg-blue-100 text-blue-700 border-blue-200",
  dessert: "bg-pink-100 text-pink-700 border-pink-200",
  pizza: "bg-orange-100 text-orange-700 border-orange-200",
  grill: "bg-red-100 text-red-700 border-red-200",
  soup: "bg-amber-100 text-amber-700 border-amber-200",
  salad: "bg-green-100 text-green-700 border-green-200",
  breakfast: "bg-yellow-100 text-yellow-700 border-yellow-200",
  other: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={cn(
            i < rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"
          )}
        />
      ))}
    </div>
  );
}

type RecipeCardProps = {
  recipe: Recipe;
  selected?: boolean;
  onSelect?: (id: string) => void;
};

export function RecipeCard({ recipe, selected, onSelect }: RecipeCardProps) {
  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-xl overflow-hidden bg-white border transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        selected ? "ring-2 ring-primary border-primary" : "border-zinc-200"
      )}
      onClick={() => onSelect?.(recipe.id)}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <div
          className={cn(
            "absolute top-2 left-2 z-10 w-5 h-5 rounded-full border-2 bg-white transition-all",
            selected
              ? "border-primary bg-primary"
              : "border-zinc-300 opacity-0 group-hover:opacity-100"
          )}
        >
          {selected && (
            <svg
              className="w-full h-full text-white p-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}

      {/* Hero image */}
      <div className="relative aspect-[4/3] w-full bg-zinc-100">
        <Image
          src={recipe.imageUrl}
          alt={recipe.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm text-zinc-900 leading-tight line-clamp-2">
          {recipe.name}
        </h3>

        <div className="flex items-center justify-between gap-2">
          <Badge
            className={cn(
              "text-xs capitalize border",
              DISH_TYPE_COLORS[recipe.dishType]
            )}
            variant="outline"
          >
            {recipe.dishType}
          </Badge>
          <StarRating rating={recipe.rating} />
        </div>

        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Clock size={12} />
          <span>{recipe.cookTime} min cook</span>
        </div>
      </div>
    </div>
  );
}
