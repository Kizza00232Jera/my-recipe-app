"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeUploadDialog } from "@/components/recipe-upload-dialog";
import type { Folder, Recipe } from "@/lib/db/schema";

type Props = {
  recipe: Recipe;
  folders: Folder[];
};

export function EditRecipeButton({ recipe, folders }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Pencil size={15} />
        Edit Recipe
      </Button>
      <RecipeUploadDialog
        open={open}
        onOpenChange={setOpen}
        folders={folders}
        recipe={recipe}
      />
    </>
  );
}
