"use client";

import { useState } from "react";
import Image from "next/image";
import { Folder, ImagePlus, Plus, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing-client";
import { createRecipe } from "@/server/actions/recipes";
import { cn } from "@/lib/utils";
import { DISH_TYPES } from "@/lib/db/schema";
import type { DishType, Folder as FolderType } from "@/lib/db/schema";

const DISH_TYPE_LABELS: Record<DishType, string> = {
  lunch: "Lunch",
  dinner: "Dinner",
  breakfast: "Breakfast",
  side: "Side Dish",
  appetizer: "Appetizer",
  snack: "Snack",
  sauce: "Sauce",
  drinks: "Drinks",
  vegan: "Vegan",
};

type Ingredient = { amount: string; unit: string; name: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FolderType[];
};

export function RecipeUploadDialog({ open, onOpenChange, folders }: Props) {
  const [imageUrl, setImageUrl] = useState("");
  const [name, setName] = useState("");
  const [dishTypes, setDishTypes] = useState<DishType[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [rating, setRating] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { amount: "", unit: "", name: "" },
  ]);
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setImageUrl("");
    setName("");
    setDishTypes([]);
    setSelectedFolderIds([]);
    setTagsInput("");
    setPrepTime("");
    setCookTime("");
    setRating("");
    setIngredients([{ amount: "", unit: "", name: "" }]);
    setInstructions("");
  }

  function toggleDishType(type: DishType) {
    setDishTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function toggleFolder(id: string) {
    setSelectedFolderIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { amount: "", unit: "", name: "" }]);
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateIngredient(i: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) =>
      prev.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing))
    );
  }

  const ratingNum = parseFloat(rating);
  const ratingValid = !isNaN(ratingNum) && ratingNum >= 0 && ratingNum <= 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl || !name || !ratingValid) return;

    setIsSubmitting(true);
    try {
      await createRecipe({
        name,
        imageUrl,
        dishTypes,
        folderIds: selectedFolderIds,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        prepTime: parseInt(prepTime) || 0,
        cookTime: parseInt(cookTime) || 0,
        ingredients: ingredients.filter((i) => i.name.trim()),
        instructions,
        rating: ratingNum,
      });
      toast.success("Recipe saved!");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Recipe</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Image upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Photo <span className="text-red-500">*</span>
            </label>
            {imageUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-200">
                <Image src={imageUrl} alt="Recipe" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50">
                <ImagePlus size={28} className="mb-2 text-zinc-400" />
                <UploadButton
                  endpoint="recipeImage"
                  onClientUploadComplete={(res) => setImageUrl(res[0]?.ufsUrl ?? "")}
                  onUploadError={(err) => { toast.error(err.message); }}
                  appearance={{
                    button: "bg-zinc-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-700",
                    allowedContent: "text-zinc-400 text-xs mt-1",
                  }}
                />
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Recipe name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spaghetti Carbonara"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          {/* Dish types — multi-select chips */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Dish type{" "}
              <span className="font-normal text-zinc-400">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DISH_TYPES.map((type) => {
                const active = dishTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleDishType(type)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                    )}
                  >
                    {DISH_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prep + cook times */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Prep time (min)
              </label>
              <input
                type="number"
                min={0}
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="15"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Cook time (min)
              </label>
              <input
                type="number"
                min={0}
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="30"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Rating — decimal input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Star size={18} className="shrink-0 fill-amber-400 text-amber-400" />
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="4.5"
                className="w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
              <span className="text-sm text-zinc-400">out of 5.0</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Tags{" "}
              <span className="font-normal text-zinc-400">(comma-separated)</span>
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="vegan, spicy, quick"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Ingredients
            </label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={ing.amount}
                    onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                    placeholder="200"
                    className="w-16 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                  <input
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                    placeholder="g"
                    className="w-14 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                  <input
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, "name", e.target.value)}
                    placeholder="flour"
                    className="flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      className="text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addIngredient}
              className="mt-2 gap-1.5 text-zinc-500"
            >
              <Plus size={14} />
              Add ingredient
            </Button>
          </div>

          {/* Instructions */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Instructions
            </label>
            <textarea
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe the cooking steps…"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          {/* Save to folders (optional) */}
          {folders.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Save to folder{" "}
                <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {folders.map((folder) => {
                  const active = selectedFolderIds.includes(folder.id);
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => toggleFolder(folder.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                      )}
                    >
                      <Folder size={11} />
                      {folder.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!imageUrl || !name || !ratingValid || isSubmitting}
            >
              {isSubmitting ? "Saving…" : "Save Recipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
