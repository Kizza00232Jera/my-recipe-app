"use client";

import { useState } from "react";
import { ChefHat, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeGrid } from "@/components/recipe-grid";
import { FolderSidebar } from "@/components/folder-sidebar";
import { MOCK_RECIPES, MOCK_FOLDERS } from "@/lib/mock-data";

export default function Home() {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-6">
          <ChefHat size={22} className="text-zinc-900" />
          <span className="font-semibold text-zinc-900">My Recipe App</span>
          <div className="ml-auto">
            <Button size="sm" className="gap-1.5">
              <Plus size={15} />
              Add Recipe
            </Button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <FolderSidebar
          folders={MOCK_FOLDERS}
          recipes={MOCK_RECIPES}
          activeFolderId={activeFolderId}
          onSelectFolder={setActiveFolderId}
        />
        <RecipeGrid recipes={MOCK_RECIPES} folders={MOCK_FOLDERS} activeFolderId={activeFolderId} />
      </div>
    </div>
  );
}
