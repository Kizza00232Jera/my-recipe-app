"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RecipeDetail } from "@/components/recipe-detail";
import type { Recipe } from "@/lib/db/schema";

export function RecipeModal({ recipe }: { recipe: Recipe }) {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={() => router.back()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <RecipeDetail recipe={recipe} />
      </DialogContent>
    </Dialog>
  );
}
