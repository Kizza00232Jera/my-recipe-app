"use client";

import { useState } from "react";
import { SlidersHorizontal, UtensilsCrossed, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DishType, Folder, Recipe } from "@/lib/db/schema";

export type MobileFilters = {
  dishTypes: DishType[];
  folderIds: string[];
  cookTimeMin: number | null;
  cookTimeMax: number | null;
};

export const DEFAULT_MOBILE_FILTERS: MobileFilters = {
  dishTypes: [],
  folderIds: [],
  cookTimeMin: null,
  cookTimeMax: null,
};

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
  folders: Folder[];
  filters: MobileFilters;
  onFilter: (filters: MobileFilters) => void;
};

export function MobileFilterBar({ recipes, folders, filters, onFilter }: MobileFilterBarProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<MobileFilters>(filters);

  const isFiltered =
    filters.dishTypes.length > 0 ||
    filters.folderIds.length > 0 ||
    filters.cookTimeMin !== null ||
    filters.cookTimeMax !== null;

  const activeCount =
    (filters.dishTypes.length > 0 ? 1 : 0) +
    (filters.folderIds.length > 0 ? 1 : 0) +
    (filters.cookTimeMin !== null || filters.cookTimeMax !== null ? 1 : 0);

  // Dish types that have at least one recipe, sorted by count descending
  const usedDishTypes = (Object.keys(DISH_TYPE_LABELS) as DishType[])
    .filter((t) => recipes.some((r) => r.dishTypes.includes(t)))
    .sort(
      (a, b) =>
        recipes.filter((r) => r.dishTypes.includes(b)).length -
        recipes.filter((r) => r.dishTypes.includes(a)).length
    );

  function openSheet() {
    setDraft(filters); // sync draft to currently applied filters before opening
    setOpen(true);
  }

  function toggleDishType(type: DishType) {
    const next = draft.dishTypes.includes(type)
      ? draft.dishTypes.filter((t) => t !== type)
      : [...draft.dishTypes, type];
    setDraft({ ...draft, dishTypes: next });
  }

  function toggleFolder(id: string) {
    const next = draft.folderIds.includes(id)
      ? draft.folderIds.filter((f) => f !== id)
      : [...draft.folderIds, id];
    setDraft({ ...draft, folderIds: next });
  }

  function setCookMin(val: string) {
    const parsed = val === "" ? null : parseInt(val, 10);
    if (parsed !== null && isNaN(parsed)) return;
    setDraft({ ...draft, cookTimeMin: parsed });
  }

  function setCookMax(val: string) {
    const parsed = val === "" ? null : parseInt(val, 10);
    if (parsed !== null && isNaN(parsed)) return;
    setDraft({ ...draft, cookTimeMax: parsed });
  }

  function applyFilters() {
    onFilter(draft);
    setOpen(false);
  }

  function resetAll() {
    onFilter(DEFAULT_MOBILE_FILTERS);
    setOpen(false);
  }

  return (
    <>
      {/* Filter bar */}
      <div className="md:hidden border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-2 px-4 py-3">
          {/* All chip — clicking resets applied filters immediately */}
          <button
            onClick={() => onFilter(DEFAULT_MOBILE_FILTERS)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              !isFiltered
                ? "border-primary bg-primary text-primary-foreground"
                : "border-zinc-200 bg-white text-zinc-600"
            )}
          >
            <UtensilsCrossed size={11} />
            All
            <span className={cn("text-[10px]", !isFiltered ? "text-zinc-300" : "text-zinc-400")}>
              {recipes.length}
            </span>
          </button>

          {/* Filter button */}
          <button
            onClick={openSheet}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              isFiltered
                ? "border-primary bg-primary text-primary-foreground"
                : "border-zinc-200 bg-white text-zinc-600"
            )}
          >
            <SlidersHorizontal size={11} />
            Filter
            {activeCount > 0 && (
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                  isFiltered ? "bg-white text-primary" : "bg-primary text-primary-foreground"
                )}
              >
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[60] flex max-h-[82vh] flex-col rounded-t-2xl bg-white shadow-xl transition-transform duration-300 ease-out md:hidden",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Sheet header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-4">
          <span className="text-base font-semibold text-zinc-900">Filter</span>
          <div className="flex items-center gap-4">
            {isFiltered && (
              <button
                onClick={resetAll}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Reset all
              </button>
            )}
            <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
          {/* Cook time range */}
          <section>
            <p className="mb-3 text-sm font-semibold text-zinc-900">Cook time</p>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2">
                <span className="shrink-0 text-xs text-zinc-500">From</span>
                <input
                  type="number"
                  min={0}
                  value={draft.cookTimeMin ?? ""}
                  onChange={(e) => setCookMin(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="shrink-0 text-xs text-zinc-400">min</span>
              </div>
              <span className="shrink-0 text-sm text-zinc-300">—</span>
              <div className="flex flex-1 items-center gap-2">
                <span className="shrink-0 text-xs text-zinc-500">To</span>
                <input
                  type="number"
                  min={0}
                  value={draft.cookTimeMax ?? ""}
                  onChange={(e) => setCookMax(e.target.value)}
                  placeholder="any"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="shrink-0 text-xs text-zinc-400">min</span>
              </div>
            </div>
          </section>

          {/* Dish type */}
          {usedDishTypes.length > 0 && (
            <section>
              <p className="mb-3 text-sm font-semibold text-zinc-900">Dish type</p>
              <div className="flex flex-wrap gap-2">
                {usedDishTypes.map((type) => {
                  const active = draft.dishTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleDishType(type)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-zinc-200 bg-white text-zinc-600"
                      )}
                    >
                      {DISH_TYPE_LABELS[type]}
                      <span
                        className={cn("text-[10px]", active ? "text-zinc-300" : "text-zinc-400")}
                      >
                        {recipes.filter((r) => r.dishTypes.includes(type)).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Folders */}
          {folders.length > 0 && (
            <section>
              <p className="mb-3 text-sm font-semibold text-zinc-900">Folders</p>
              <div className="flex flex-wrap gap-2">
                {folders.map((folder) => {
                  const active = draft.folderIds.includes(folder.id);
                  const count = recipes.filter((r) => r.folderIds.includes(folder.id)).length;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => toggleFolder(folder.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-zinc-200 bg-white text-zinc-600"
                      )}
                    >
                      {folder.name}
                      <span
                        className={cn("text-[10px]", active ? "text-zinc-300" : "text-zinc-400")}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sticky Apply footer */}
        <div className="shrink-0 border-t border-zinc-100 px-5 py-4">
          <button
            onClick={applyFilters}
            className="bg-primary text-primary-foreground w-full rounded-xl py-3 text-sm font-semibold transition-opacity active:opacity-90"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
