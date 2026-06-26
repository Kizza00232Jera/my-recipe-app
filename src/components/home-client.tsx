"use client";

import Link from "next/link";
import { useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { ChefHat, Plus } from "lucide-react";
import { RecipeGrid } from "@/components/recipe-grid";
import { FolderSidebar } from "@/components/folder-sidebar";
import { MobileFilterBar, DEFAULT_MOBILE_FILTERS } from "@/components/mobile-filter-bar";
import type { MobileFilters } from "@/components/mobile-filter-bar";
import { RecipeUploadDialog } from "@/components/recipe-upload-dialog";
import { BottomNav } from "@/components/bottom-nav";
import { DemoBanner } from "@/components/demo-banner";
import { InstallBanner } from "@/components/install-banner";
import type { Recipe, Folder, DishType } from "@/lib/db/schema";

type HomeClientProps = {
  recipes: Recipe[];
  folders: Folder[];
  isDemo?: boolean;
  linkPrefix?: string;
};

export function HomeClient({ recipes, folders, isDemo = false, linkPrefix }: HomeClientProps) {
  const { user } = useUser();
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeDishType, setActiveDishType] = useState<DishType | null>(null);
  const [mobileFilters, setMobileFilters] = useState<MobileFilters>(DEFAULT_MOBILE_FILTERS);
  const [uploadOpen, setUploadOpen] = useState(false);

  const firstName = user?.firstName || user?.username || "there";

  return (
    <div className="min-h-screen bg-zinc-50">
      {isDemo && <DemoBanner />}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* Mobile: logo mark + greeting */}
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <span className="bg-brand-soft text-primary grid h-8 w-8 shrink-0 place-items-center rounded-xl">
              <ChefHat size={17} />
            </span>
            <span className="font-display truncate text-base font-bold text-zinc-900">
              {isDemo ? "Welcome 👋" : `Hi, ${firstName} 👋`}
            </span>
          </div>

          {/* Desktop: logo + app name */}
          <div className="hidden items-center gap-2 md:flex">
            <span className="bg-brand-soft text-primary grid h-8 w-8 place-items-center rounded-xl">
              <ChefHat size={18} />
            </span>
            <span className="font-display text-lg font-bold text-zinc-900">My Recipes</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {isDemo ? (
              <Link
                href="/sign-in"
                className="rounded-xl border border-zinc-200 px-3.5 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Sign in
              </Link>
            ) : (
              <>
                {/* Add Recipe button — desktop only (mobile uses bottom nav) */}
                <button
                  onClick={() => setUploadOpen(true)}
                  className="bg-primary text-primary-foreground hidden items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm shadow-green-600/20 transition-opacity hover:opacity-90 md:inline-flex"
                >
                  <Plus size={16} /> Add recipe
                </button>
                <UserButton />
              </>
            )}
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

      {!isDemo && (
        <RecipeUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} folders={folders} />
      )}

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
          isDemo={isDemo}
          linkPrefix={linkPrefix}
        />
      </div>

      {/* Install banner — slides up above the bottom nav on mobile */}
      <InstallBanner />

      {/* Mobile bottom nav */}
      <BottomNav onAddRecipe={() => setUploadOpen(true)} isDemo={isDemo} />
    </div>
  );
}
