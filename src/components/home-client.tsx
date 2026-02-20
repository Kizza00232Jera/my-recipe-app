"use client";

import { useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { ChefHat } from "lucide-react";
import { RecipeGrid } from "@/components/recipe-grid";
import { FolderSidebar } from "@/components/folder-sidebar";
import { MobileFilterBar, DEFAULT_MOBILE_FILTERS } from "@/components/mobile-filter-bar";
import type { MobileFilters } from "@/components/mobile-filter-bar";
import { RecipeUploadDialog } from "@/components/recipe-upload-dialog";
import { BottomNav } from "@/components/bottom-nav";
import type { Recipe, Folder, DishType } from "@/lib/db/schema";

type HomeClientProps = {
  recipes: Recipe[];
  folders: Folder[];
};

export function HomeClient({ recipes, folders }: HomeClientProps) {
  const { user } = useUser();
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeDishType, setActiveDishType] = useState<DishType | null>(null);
  const [mobileFilters, setMobileFilters] = useState<MobileFilters>(DEFAULT_MOBILE_FILTERS);
  const [uploadOpen, setUploadOpen] = useState(false);

  const firstName = user?.firstName || user?.username || "there";

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* Mobile: greeting */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-base font-semibold text-zinc-900">
              Hello, {firstName} 👋
            </span>
          </div>

          {/* Desktop: logo + app name */}
          <div className="hidden items-center gap-2 md:flex">
            <ChefHat size={22} className="text-zinc-900" />
            <span className="font-semibold text-zinc-900">My Recipes</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Add Recipe button — desktop only (mobile uses bottom nav) */}
            <button
              onClick={() => setUploadOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              + Add Recipe
            </button>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Mobile filter bar */}
      <MobileFilterBar
        recipes={recipes}
        folders={folders}
        filters={mobileFilters}
        onFilter={setMobileFilters}
      />

      <RecipeUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} folders={folders} />

      {/* Main layout */}
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">
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
          mobileFilters={mobileFilters}
        />
      </div>

      {/* Mobile bottom nav */}
      <BottomNav onAddRecipe={() => setUploadOpen(true)} />
    </div>
  );
}
