"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { RecipeUploadDialog } from "@/components/recipe-upload-dialog";
import type { Folder, Recipe } from "@/lib/db/schema";

/**
 * Shown on a sparse recipe's page. Opens the editor (which contains the
 * "Import with AI" flow) so the user can fill the missing fields. Never
 * auto-saves — the user reviews and publishes from the editor.
 */
export function EnhanceWithAiButton({ recipe, folders }: { recipe: Recipe; folders: Folder[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-violet-accent flex w-full items-center gap-2.5 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-left text-sm"
      >
        <Sparkles size={18} className="shrink-0" />
        <span>
          This recipe is missing some details.{" "}
          <span className="font-bold underline">Complete with AI</span> to fill servings,
          description &amp; more — you review before saving.
        </span>
      </button>
      <RecipeUploadDialog open={open} onOpenChange={setOpen} folders={folders} recipe={recipe} />
    </>
  );
}
