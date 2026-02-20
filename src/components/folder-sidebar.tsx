"use client";

import { useState } from "react";
import { FolderOpen, Folder, Plus, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createFolder } from "@/server/actions/folders";
import type { Folder as FolderType, Recipe, DishType } from "@/lib/db/schema";

const DISH_TYPE_LABELS: Record<DishType, string> = {
  main: "Main Dish",
  dessert: "Dessert",
  pizza: "Pizza",
  grill: "Grill",
  soup: "Soup",
  salad: "Salad",
  breakfast: "Breakfast",
  other: "Other",
};

type FolderSidebarProps = {
  folders: FolderType[];
  recipes: Recipe[];
  activeFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  activeDishType: DishType | null;
  onSelectDishType: (type: DishType | null) => void;
};

export function FolderSidebar({
  folders,
  recipes,
  activeFolderId,
  onSelectFolder,
  activeDishType,
  onSelectDishType,
}: FolderSidebarProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function countInFolder(folderId: string) {
    return recipes.filter((r) => r.folderIds.includes(folderId)).length;
  }

  function countByType(type: DishType) {
    return recipes.filter((r) => r.dishTypes.includes(type)).length;
  }

  // Only show dish types that have at least one recipe
  const usedDishTypes = (Object.keys(DISH_TYPE_LABELS) as DishType[]).filter(
    (t) => countByType(t) > 0
  );

  async function handleCreate() {
    if (!newFolderName.trim()) return;
    setIsSubmitting(true);
    try {
      await createFolder(newFolderName.trim());
      toast.success(`Folder "${newFolderName.trim()}" created.`);
      setNewFolderName("");
      setIsCreating(false);
    } catch {
      toast.error("Failed to create folder. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <aside className="hidden md:block w-56 shrink-0">
      <nav className="space-y-0.5">
        {/* All recipes */}
        <button
          onClick={() => {
            onSelectFolder(null);
            onSelectDishType(null);
          }}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activeFolderId === null && activeDishType === null
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          )}
        >
          <UtensilsCrossed size={15} />
          <span>All Recipes</span>
          <span
            className={cn(
              "ml-auto text-xs",
              activeFolderId === null && activeDishType === null
                ? "text-zinc-300"
                : "text-zinc-400"
            )}
          >
            {recipes.length}
          </span>
        </button>

        {/* Dish types */}
        {usedDishTypes.length > 0 && (
          <>
            <p className="px-3 pt-4 pb-1 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              By Type
            </p>
            {usedDishTypes.map((type) => {
              const isActive = activeDishType === type;
              return (
                <button
                  key={type}
                  onClick={() => onSelectDishType(isActive ? null : type)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <span className="flex-1 truncate text-left">{DISH_TYPE_LABELS[type]}</span>
                  <span className={cn("text-xs", isActive ? "text-zinc-300" : "text-zinc-400")}>
                    {countByType(type)}
                  </span>
                </button>
              );
            })}
          </>
        )}

        {/* Folders */}
        {folders.length > 0 && (
          <p className="px-3 pt-4 pb-1 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            Folders
          </p>
        )}

        {folders.map((folder) => {
          const isActive = activeFolderId === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              {isActive ? <FolderOpen size={15} /> : <Folder size={15} />}
              <span className="flex-1 truncate text-left">{folder.name}</span>
              <span className={cn("text-xs", isActive ? "text-zinc-300" : "text-zinc-400")}>
                {countInFolder(folder.id)}
              </span>
            </button>
          );
        })}
      </nav>

      {/* New folder */}
      <div className="mt-4">
        {isCreating ? (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewFolderName("");
                }
              }}
              placeholder="Folder name…"
              className="focus:ring-primary w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
            />
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="flex-1 text-xs"
                onClick={handleCreate}
                disabled={!newFolderName.trim() || isSubmitting}
              >
                {isSubmitting ? "Creating…" : "Create"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                disabled={isSubmitting}
                onClick={() => {
                  setIsCreating(false);
                  setNewFolderName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-500 hover:text-zinc-900"
            onClick={() => setIsCreating(true)}
          >
            <Plus size={14} />
            New folder
          </Button>
        )}
      </div>
    </aside>
  );
}
