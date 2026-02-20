"use client";

import { useState } from "react";
import { FolderOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import { RecipeUploadDialog } from "@/components/recipe-upload-dialog";
import { createFolder } from "@/server/actions/folders";
import type { Folder, Recipe } from "@/lib/db/schema";

type FoldersClientProps = {
  folders: Folder[];
  recipes: Recipe[];
};

export function FoldersClient({ folders, recipes }: FoldersClientProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function countInFolder(folderId: string) {
    return recipes.filter((r) => r.folderIds.includes(folderId)).length;
  }

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
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <h1 className="text-base font-semibold text-zinc-900">Folders</h1>
          <div className="ml-auto">
            <Button size="sm" onClick={() => setIsCreating(true)} className="gap-1.5">
              <Plus size={14} />
              New folder
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6">
        {/* New folder input */}
        {isCreating && (
          <div className="mb-4 flex items-center gap-2">
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
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
            <Button
              onClick={handleCreate}
              disabled={!newFolderName.trim() || isSubmitting}
              size="sm"
            >
              {isSubmitting ? "Creating…" : "Create"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => {
                setIsCreating(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {folders.length === 0 && !isCreating ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FolderOpen size={40} className="mb-3 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-500">No folders yet</p>
            <p className="mt-1 text-xs text-zinc-400">
              Create a folder to organise your recipes
            </p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => setIsCreating(true)}>
              <Plus size={14} />
              New folder
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {folders.map((folder) => {
              const count = countInFolder(folder.id);
              return (
                <div
                  key={folder.id}
                  className="flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <FolderOpen size={24} className="text-zinc-400" />
                  <div>
                    <p className="line-clamp-1 text-sm font-semibold text-zinc-900">
                      {folder.name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {count} {count === 1 ? "recipe" : "recipes"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RecipeUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} folders={folders} />
      <BottomNav onAddRecipe={() => setUploadOpen(true)} />
    </div>
  );
}
