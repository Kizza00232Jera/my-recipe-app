"use client";

import { useState } from "react";
import { FolderInput } from "lucide-react";
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
};

export function RecipeGrid({ recipes, folders, activeFolderId, activeDishType, mobileFilters }: RecipeGridProps) {
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
      {/* Multi-select action bar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-20 mb-4 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-zinc-700">{selected.size} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={targetFolderId}
              onChange={(e) => setTargetFolderId(e.target.value)}
              className="focus:ring-primary rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
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
              className="gap-1.5"
              disabled={!targetFolderId || isMoving}
              onClick={handleAdd}
            >
              <FolderInput size={14} />
              {isMoving ? "Adding…" : "Add"}
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelected} disabled={isMoving}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
          <p className="text-lg font-medium">No recipes yet</p>
          <p className="mt-1 text-sm">Add your first recipe to get started</p>
        </div>
      )}

      {/* Grid — 1 col on mobile, progressive on larger screens */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            selected={selected.has(recipe.id)}
            onSelect={toggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
