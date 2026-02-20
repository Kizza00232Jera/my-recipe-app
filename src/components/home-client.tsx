"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { ChefHat, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeGrid } from "@/components/recipe-grid";
import { FolderSidebar } from "@/components/folder-sidebar";
import { RecipeUploadDialog } from "@/components/recipe-upload-dialog";
import type { Recipe, Folder, DishType } from "@/lib/db/schema";

type HomeClientProps = {
  recipes: Recipe[];
  folders: Folder[];
};

export function HomeClient({ recipes, folders }: HomeClientProps) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeDishType, setActiveDishType] = useState<DishType | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-6">
          <ChefHat size={22} className="text-zinc-900" />
          <span className="font-semibold text-zinc-900">My Recipe App</span>
          <div className="ml-auto flex items-center gap-3">
            <Button size="sm" className="gap-1.5" onClick={() => setUploadOpen(true)}>
              <Plus size={15} />
              Add Recipe
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      <RecipeUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      {/* Main layout */}
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <FolderSidebar
          folders={folders}
          recipes={recipes}
          activeFolderId={activeFolderId}
          onSelectFolder={setActiveFolderId}
          activeDishType={activeDishType}
          onSelectDishType={setActiveDishType}
        />
        <RecipeGrid
          recipes={recipes}
          folders={folders}
          activeFolderId={activeFolderId}
          activeDishType={activeDishType}
        />
      </div>
    </div>
  );
}
