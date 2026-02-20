"use client";

import { useState } from "react";
import { Plus, UtensilsCrossed, Folder } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createFolder } from "@/server/actions/folders";
import type { Folder as FolderType, Recipe, DishType } from "@/lib/db/schema";

const DISH_TYPE_LABELS: Record<DishType, string> = {
  main: "Main",
  dessert: "Dessert",
  pizza: "Pizza",
  grill: "Grill",
  soup: "Soup",
  salad: "Salad",
  breakfast: "Breakfast",
  other: "Other",
};

type MobileFilterBarProps = {
  folders: FolderType[];
  recipes: Recipe[];
  activeFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  activeDishType: DishType | null;
  onSelectDishType: (type: DishType | null) => void;
};

export function MobileFilterBar({
  folders,
  recipes,
  activeFolderId,
  onSelectFolder,
  activeDishType,
  onSelectDishType,
}: MobileFilterBarProps) {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usedDishTypes = (Object.keys(DISH_TYPE_LABELS) as DishType[]).filter((t) =>
    recipes.some((r) => r.dishTypes.includes(t))
  );

  async function handleCreate() {
    if (!newFolderName.trim()) return;
    setIsSubmitting(true);
    try {
      await createFolder(newFolderName.trim());
      toast.success(`Folder "${newFolderName.trim()}" created.`);
      setNewFolderName("");
      setShowNewFolder(false);
    } catch {
      toast.error("Failed to create folder. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isAllActive = activeFolderId === null && activeDishType === null;

  return (
    <div className="md:hidden border-b border-zinc-200 bg-white">
      <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* All chip */}
        <button
          onClick={() => {
            onSelectFolder(null);
            onSelectDishType(null);
          }}
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

        {/* Dish type chips */}
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

        {/* Folder chips */}
        {folders.map((folder) => {
          const isActive = activeFolderId === folder.id;
          const count = recipes.filter((r) => r.folderIds.includes(folder.id)).length;
          return (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600"
              )}
            >
              <Folder size={11} />
              {folder.name}
              <span className={cn("text-[10px]", isActive ? "text-zinc-300" : "text-zinc-400")}>
                {count}
              </span>
            </button>
          );
        })}

        {/* New folder */}
        {showNewFolder ? (
          <div className="inline-flex shrink-0 items-center gap-1.5">
            <input
              autoFocus
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setShowNewFolder(false);
                  setNewFolderName("");
                }
              }}
              placeholder="Folder name…"
              className="w-28 rounded-full border border-zinc-300 px-3 py-1.5 text-xs focus:border-zinc-900 focus:outline-none"
            />
            <button
              onClick={handleCreate}
              disabled={!newFolderName.trim() || isSubmitting}
              className="rounded-full border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {isSubmitting ? "…" : "Add"}
            </button>
            <button
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName("");
              }}
              className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewFolder(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
          >
            <Plus size={11} />
            New folder
          </button>
        )}
      </div>
    </div>
  );
}
