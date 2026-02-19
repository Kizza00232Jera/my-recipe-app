"use client";

import { useState } from "react";
import { FolderInput } from "lucide-react";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import type { Recipe, Folder } from "@/lib/mock-data";

type RecipeGridProps = {
  recipes: Recipe[];
  folders: Folder[];
  activeFolderId: string | null;
};

export function RecipeGrid({ recipes, folders, activeFolderId }: RecipeGridProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered =
    activeFolderId === null ? recipes : recipes.filter((r) => r.folderId === activeFolderId);

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
  }

  return (
    <div className="min-w-0 flex-1">
      {/* Multi-select action bar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-20 mb-4 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-zinc-700">{selected.size} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <select className="focus:ring-primary rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:ring-2 focus:outline-none">
              <option value="">Move to folder…</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <Button size="sm" variant="outline" className="gap-1.5">
              <FolderInput size={14} />
              Move
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelected}>
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

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
