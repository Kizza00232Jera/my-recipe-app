"use client";

import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recipe, DishType } from "@/lib/db/schema";

const DISH_TYPE_LABELS: Record<DishType, string> = {
  lunch: "Lunch",
  dinner: "Dinner",
  breakfast: "Breakfast",
  side: "Side Dish",
  appetizer: "Appetizer",
  snack: "Snack",
  sauce: "Sauce",
  drinks: "Drinks",
  vegan: "Vegan",
};

type MobileFilterBarProps = {
  recipes: Recipe[];
  activeDishType: DishType | null;
  onSelectDishType: (type: DishType | null) => void;
};

export function MobileFilterBar({
  recipes,
  activeDishType,
  onSelectDishType,
}: MobileFilterBarProps) {
  // Only dish types that have recipes, sorted by count descending (most popular first)
  const usedDishTypes = (Object.keys(DISH_TYPE_LABELS) as DishType[])
    .filter((t) => recipes.some((r) => r.dishTypes.includes(t)))
    .sort(
      (a, b) =>
        recipes.filter((r) => r.dishTypes.includes(b)).length -
        recipes.filter((r) => r.dishTypes.includes(a)).length
    );

  const isAllActive = activeDishType === null;

  return (
    <div className="md:hidden border-b border-zinc-200 bg-white">
      <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* All chip */}
        <button
          onClick={() => onSelectDishType(null)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            isAllActive
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-200 bg-white text-zinc-600"
          )}
        >
          <UtensilsCrossed size={11} />
          All
          <span className={cn("text-[10px]", isAllActive ? "text-zinc-300" : "text-zinc-400")}>
            {recipes.length}
          </span>
        </button>

        {/* Dish type chips — sorted by popularity */}
        {usedDishTypes.map((type) => {
          const isActive = activeDishType === type;
          return (
            <button
              key={type}
              onClick={() => onSelectDishType(isActive ? null : type)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600"
              )}
            >
              {DISH_TYPE_LABELS[type]}
              <span className={cn("text-[10px]", isActive ? "text-zinc-300" : "text-zinc-400")}>
                {recipes.filter((r) => r.dishTypes.includes(type)).length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
