"use client";

import { useState } from "react";
import { FolderInput, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { addRecipesToFolder } from "@/server/actions/recipes";
import type { MobileFilters } from "@/components/mobile-filter-bar";
import type { Recipe, Folder, DishType } from "@/lib/db/schema";

type RecipeGridProps = {
  recipes: Recipe[];
  folders: Folder[];
  activeFolderId: string | null;
  activeDishType: DishType | null;
  mobileFilters: MobileFilters;
  isDemo?: boolean;
  linkPrefix?: string;
};

export function RecipeGrid({ recipes, folders, activeFolderId, activeDishType, mobileFilters, isDemo = false, linkPrefix }: RecipeGridProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetFolderId, setTargetFolderId] = useState("");
  const [isMoving, setIsMoving] = useState(false);

  const filtered = recipes
    .filter((r) => activeFolderId === null || r.folderIds.includes(activeFolderId))
    .filter((r) => activeDishType === null || r.dishTypes.includes(activeDishType))
    .filter((r) => mobileFilters.dishTypes.length === 0 || r.dishTypes.some((t) => mobileFilters.dishTypes.includes(t as DishType)))
    .filter((r) => mobileFilters.folderIds.length === 0 || r.folderIds.some((id) => mobileFilters.folderIds.includes(id)))
    .filter((r) => mobileFilters.cookTimeMin === null || r.cookTime >= mobileFilters.cookTimeMin)
    .filter((r) => mobileFilters.cookTimeMax === null || r.cookTime <= mobileFilters.cookTimeMax);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelected() {
    setSelected(new Set());
    setTargetFolderId("");
  }

  async function handleAdd() {
    if (!targetFolderId || selected.size === 0) return;
    setIsMoving(true);
    try {
      await addRecipesToFolder(Array.from(selected), targetFolderId);
      const folder = folders.find((f) => f.id === targetFolderId);
      toast.success(
        `${selected.size} recipe${selected.size > 1 ? "s" : ""} added to "${folder?.name}".`
      );
      clearSelected();
    } catch {
      toast.error("Failed to add recipes to folder. Please try again.");
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <div className="min-w-0 flex-1">
      {/* Multi-select action bar — hidden in demo mode */}
      {!isDemo && selected.size > 0 && (
        <div className="sticky top-2 z-20 mb-4 flex flex-col gap-2.5 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur sm:flex-row sm:items-center sm:gap-3">
          <span className="text-primary text-sm font-bold">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2 sm:ml-auto">
            <select
              value={targetFolderId}
              onChange={(e) => setTargetFolderId(e.target.value)}
              className="focus:ring-primary min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none sm:flex-none"
            >
              <option value="">Add to folder…</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5"
              disabled={!targetFolderId || isMoving}
              onClick={handleAdd}
            >
              <FolderInput size={14} />
              {isMoving ? "Adding…" : "Add"}
            </Button>
            <Button size="sm" variant="ghost" className="shrink-0" onClick={clearSelected} disabled={isMoving}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/60 px-6 py-20 text-center">
          <span className="bg-brand-soft text-primary mb-4 grid h-16 w-16 place-items-center rounded-2xl">
            <UtensilsCrossed size={28} />
          </span>
          <p className="font-display text-lg font-bold text-zinc-700">Nothing here yet</p>
          <p className="mt-1 max-w-xs text-sm text-zinc-500">
            {isDemo
              ? "No recipes match these filters — try clearing them."
              : "Add your first recipe — or let AI create one for you in seconds."}
          </p>
        </div>
      )}

      {/* Grid — 1 col on mobile, progressive on larger screens */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            selected={!isDemo && selected.has(recipe.id)}
            onSelect={isDemo ? undefined : toggleSelect}
            linkPrefix={linkPrefix}
          />
        ))}
      </div>
    </div>
  );
}
