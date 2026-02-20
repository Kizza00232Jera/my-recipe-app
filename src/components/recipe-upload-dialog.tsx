"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, Plus, Star, Trash2, X } from "lucide-react";
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
import type { DishType } from "@/lib/db/schema";

const DISH_TYPES: { value: DishType; label: string }[] = [
  { value: "main", label: "Main Dish" },
  { value: "dessert", label: "Dessert" },
  { value: "pizza", label: "Pizza" },
  { value: "grill", label: "Grill" },
  { value: "soup", label: "Soup" },
  { value: "salad", label: "Salad" },
  { value: "breakfast", label: "Breakfast" },
  { value: "other", label: "Other" },
];

type Ingredient = { amount: string; unit: string; name: string };

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function RecipeUploadDialog({ open, onOpenChange }: Props) {
  const [imageUrl, setImageUrl] = useState("");
  const [name, setName] = useState("");
  const [dishType, setDishType] = useState<DishType>("main");
  const [tagsInput, setTagsInput] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { amount: "", unit: "", name: "" },
  ]);
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setImageUrl("");
    setName("");
    setDishType("main");
    setTagsInput("");
    setPrepTime("");
    setCookTime("");
    setRating(0);
    setHoverRating(0);
    setIngredients([{ amount: "", unit: "", name: "" }]);
    setInstructions("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl || !name || rating === 0) return;

    setIsSubmitting(true);
    try {
      await createRecipe({
        name,
        imageUrl,
        dishType,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        prepTime: parseInt(prepTime) || 0,
        cookTime: parseInt(cookTime) || 0,
        ingredients: ingredients.filter((i) => i.name.trim()),
        instructions,
        rating,
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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

          {/* Dish type + times row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Dish type
              </label>
              <select
                value={dishType}
                onChange={(e) => setDishType(e.target.value as DishType)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              >
                {DISH_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Prep (min)
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
                Cook (min)
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

          {/* Rating */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    size={24}
                    className={cn(
                      "transition-colors",
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-300"
                    )}
                  />
                </button>
              ))}
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
              placeholder="chicken, spicy, quick"
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
              disabled={!imageUrl || !name || rating === 0 || isSubmitting}
            >
              {isSubmitting ? "Saving…" : "Save Recipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
