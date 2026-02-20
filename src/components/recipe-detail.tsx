import Image from "next/image";
import { CalendarDays, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Recipe, DishType } from "@/lib/db/schema";

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
          size={16}
          className={cn(i < rating ? "fill-amber-400 text-amber-400" : "text-zinc-300")}
        />
      ))}
    </div>
  );
}

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  return (
    <div className="space-y-6">
      {/* Hero image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-100">
        <Image
          src={recipe.imageUrl}
          alt={recipe.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 672px"
          priority
        />
      </div>

      {/* Title row */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900">{recipe.name}</h1>
        <div className="flex items-center gap-3">
          <Badge
            className={cn("border text-xs capitalize", DISH_TYPE_COLORS[recipe.dishType])}
            variant="outline"
          >
            {recipe.dishType}
          </Badge>
          <StarRating rating={recipe.rating} />
        </div>
      </div>

      {/* Times + date */}
      <div className="flex flex-wrap gap-6 text-sm text-zinc-600">
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>
            <span className="font-medium">{recipe.prepTime} min</span> prep
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>
            <span className="font-medium">{recipe.cookTime} min</span> cook
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDays size={14} />
          <span>
            Added{" "}
            <span className="font-medium">
              {new Date(recipe.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </span>
        </div>
      </div>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Ingredients */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Ingredients</h2>
        <ul className="space-y-1.5">
          {(recipe.ingredients as { amount: string; unit: string; name: string }[]).map(
            (ing, i) => (
              <li key={i} className="flex items-baseline gap-2 text-sm text-zinc-700">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                <span>
                  {ing.amount} {ing.unit} {ing.name}
                </span>
              </li>
            )
          )}
        </ul>
      </div>

      {/* Instructions */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Instructions</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">
          {recipe.instructions}
        </p>
      </div>
    </div>
  );
}
