"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  Folder,
  GripVertical,
  ImagePlus,
  Plus,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecipeImportPanel } from "@/components/recipe-import-panel";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing-client";
import { createRecipe, updateRecipe } from "@/server/actions/recipes";
import { cn } from "@/lib/utils";
import { DISH_TYPES, DIFFICULTIES } from "@/lib/db/schema";
import { getSteps, stepsToInstructions, totalTime } from "@/lib/recipe-utils";
import type { Difficulty, DishType, Folder as FolderType, Ingredient, Recipe, Step } from "@/lib/db/schema";
import type { ImportDraft } from "@/lib/ai/types";

const DISH_TYPE_LABELS: Record<DishType, string> = {
  lunch: "Lunch",
  dinner: "Dinner",
  breakfast: "Breakfast",
  side: "Side",
  appetizer: "Appetizer",
  snack: "Snack",
  sauce: "Sauce",
  drinks: "Drinks",
  vegan: "Vegan",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FolderType[];
  recipe?: Recipe;
};

const FIELD =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-base text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white";
const LABEL = "mb-2 block text-sm font-semibold text-zinc-700";

// In-progress recipes are autosaved here (create mode only) so an accidental
// close never loses work. Cleared on publish or explicit discard.
const DRAFT_KEY = "recipe-upload-draft:v1";

type DraftState = {
  photos: string[];
  name: string;
  description: string;
  dishTypes: DishType[];
  cuisine: string;
  selectedFolderIds: string[];
  tags: string[];
  prepTime: string;
  cookTime: string;
  servings: string;
  calories: string;
  difficulty: Difficulty | "";
  source: string;
  rating: number;
  ingredients: Ingredient[];
  steps: Step[];
};

function draftHasContent(d: DraftState): boolean {
  return Boolean(
    d.name.trim() ||
      d.photos.length ||
      d.description.trim() ||
      d.cuisine.trim() ||
      d.source.trim() ||
      d.tags.length ||
      d.prepTime ||
      d.cookTime ||
      d.servings ||
      d.calories ||
      d.difficulty ||
      d.rating ||
      d.ingredients.some((i) => i.name.trim()) ||
      d.steps.some((s) => s.text.trim())
  );
}

function loadDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as DraftState) : null;
  } catch {
    return null;
  }
}

function recipeToDraft(r: Recipe): DraftState {
  const st = getSteps(r);
  return {
    photos: [r.imageUrl, ...(r.imageUrls ?? [])].filter(Boolean),
    name: r.name,
    description: r.description ?? "",
    dishTypes: r.dishTypes as DishType[],
    cuisine: r.cuisine ?? "",
    selectedFolderIds: r.folderIds ?? [],
    tags: r.tags ?? [],
    prepTime: String(r.prepTime ?? ""),
    cookTime: String(r.cookTime ?? ""),
    servings: r.servings != null ? String(r.servings) : "",
    calories: r.calories != null ? String(r.calories) : "",
    difficulty: (r.difficulty as Difficulty) ?? "",
    source: r.source ?? "",
    rating: Math.round(r.rating ?? 0),
    ingredients: r.ingredients.length > 0 ? r.ingredients : [{ amount: "", unit: "", name: "" }],
    steps: st.length > 0 ? st : [{ text: "" }],
  };
}

export function RecipeUploadDialog({ open, onOpenChange, folders, recipe }: Props) {
  const [photos, setPhotos] = useState<string[]>([]); // photos[0] = cover
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dishTypes, setDishTypes] = useState<DishType[]>([]);
  const [cuisine, setCuisine] = useState("");
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [calories, setCalories] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [source, setSource] = useState("");
  const [rating, setRating] = useState(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ amount: "", unit: "", name: "" }]);
  const [steps, setSteps] = useState<Step[]>([{ text: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [kbPad, setKbPad] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const baselineRef = useRef(""); // serialized snapshot to detect "dirty" in edit mode

  function snapshot(): DraftState {
    return {
      photos,
      name,
      description,
      dishTypes,
      cuisine,
      selectedFolderIds,
      tags,
      prepTime,
      cookTime,
      servings,
      calories,
      difficulty,
      source,
      rating,
      ingredients,
      steps,
    };
  }
  const draftJson = JSON.stringify(snapshot());

  function applySnapshot(d: DraftState) {
    setPhotos(d.photos ?? []);
    setName(d.name ?? "");
    setDescription(d.description ?? "");
    setDishTypes(d.dishTypes ?? []);
    setCuisine(d.cuisine ?? "");
    setSelectedFolderIds(d.selectedFolderIds ?? []);
    setTags(d.tags ?? []);
    setPrepTime(d.prepTime ?? "");
    setCookTime(d.cookTime ?? "");
    setServings(d.servings ?? "");
    setCalories(d.calories ?? "");
    setDifficulty(d.difficulty ?? "");
    setSource(d.source ?? "");
    setRating(d.rating ?? 0);
    setIngredients(d.ingredients?.length ? d.ingredients : [{ amount: "", unit: "", name: "" }]);
    setSteps(d.steps?.length ? d.steps : [{ text: "" }]);
  }

  // Has the user entered anything worth not losing?
  function isDirty(): boolean {
    if (recipe) return draftJson !== baselineRef.current;
    return draftHasContent(snapshot());
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }

  function doClose() {
    setConfirmClose(false);
    onOpenChange(false);
  }

  // Close requested via X / Esc / outside-click / Cancel.
  function requestClose() {
    if (importOpen) {
      // back out of the import panel first instead of nuking the dialog
      setImportOpen(false);
      return;
    }
    if (isDirty()) {
      setConfirmClose(true);
      return;
    }
    doClose();
  }

  function handleOpenChange(next: boolean) {
    if (next) onOpenChange(true);
    else requestClose();
  }

  // populate / restore on open
  useEffect(() => {
    if (!open) return;
    setConfirmClose(false);
    setTagDraft("");
    if (recipe) {
      const base = recipeToDraft(recipe);
      applySnapshot(base);
      baselineRef.current = JSON.stringify(base);
      setDraftRestored(false);
    } else {
      const saved = loadDraft();
      if (saved && draftHasContent(saved)) {
        applySnapshot(saved);
        setDraftRestored(true);
      } else {
        reset();
        setDraftRestored(false);
      }
      baselineRef.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Autosave the in-progress recipe (create mode only), debounced.
  useEffect(() => {
    if (!open || recipe) return;
    const d = snapshot();
    if (!draftHasContent(d)) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, draftJson);
      } catch {
        /* ignore quota errors */
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftJson, open]);

  // ── phone keyboard safety: keep the focused field visible above the keyboard ──
  useEffect(() => {
    if (!open) return;
    function onFocusIn(e: FocusEvent) {
      const el = e.target as HTMLElement;
      if (el && el.matches("input,textarea,select")) {
        setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 220);
      }
    }
    document.addEventListener("focusin", onFocusIn);
    const vv = window.visualViewport;
    function onVV() {
      if (!vv) return;
      const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbPad(covered);
    }
    vv?.addEventListener("resize", onVV);
    vv?.addEventListener("scroll", onVV);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      vv?.removeEventListener("resize", onVV);
      vv?.removeEventListener("scroll", onVV);
      setKbPad(0);
    };
  }, [open]);

  function reset() {
    setPhotos([]);
    setName("");
    setDescription("");
    setDishTypes([]);
    setCuisine("");
    setSelectedFolderIds([]);
    setTags([]);
    setTagDraft("");
    setPrepTime("");
    setCookTime("");
    setServings("");
    setCalories("");
    setDifficulty("");
    setSource("");
    setRating(0);
    setIngredients([{ amount: "", unit: "", name: "" }]);
    setSteps([{ text: "" }]);
  }

  function applyDraft(d: ImportDraft) {
    if (d.imageUrl) setPhotos((p) => (p.length ? p : [d.imageUrl]));
    if (d.name) setName(d.name);
    if (d.description) setDescription(d.description);
    if (d.dishTypes.length) setDishTypes(d.dishTypes);
    if (d.cuisine) setCuisine(d.cuisine);
    if (d.tags.length) setTags(d.tags);
    if (d.prepTime) setPrepTime(String(d.prepTime));
    if (d.cookTime) setCookTime(String(d.cookTime));
    if (d.servings != null) setServings(String(d.servings));
    if (d.calories != null) setCalories(String(d.calories));
    if (d.difficulty) setDifficulty(d.difficulty);
    if (d.ingredients.length) setIngredients(d.ingredients);
    if (d.steps.length) setSteps(d.steps);
    toast.success("Recipe filled in — check it over, then tap Publish.");
  }

  // helpers
  const toggleDishType = (t: DishType) =>
    setDishTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  const toggleFolder = (id: string) =>
    setSelectedFolderIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const updateIngredient = (i: number, field: keyof Ingredient, value: string) =>
    setIngredients((p) => p.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing)));
  const addIngredient = () => setIngredients((p) => [...p, { amount: "", unit: "", name: "" }]);
  const removeIngredient = (i: number) => setIngredients((p) => p.filter((_, idx) => idx !== i));

  const updateStep = (i: number, value: string) =>
    setSteps((p) => p.map((s, idx) => (idx === i ? { ...s, text: value } : s)));
  const setStepPhoto = (i: number, url: string) =>
    setSteps((p) => p.map((s, idx) => (idx === i ? { ...s, imageUrl: url } : s)));
  const addStep = () => setSteps((p) => [...p, { text: "" }]);
  const removeStep = (i: number) => setSteps((p) => p.filter((_, idx) => idx !== i));

  function commitTag() {
    const t = tagDraft.trim().replace(/,$/, "");
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagDraft("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cover = photos[0];
    if (!cover || !name.trim()) {
      toast.error("A photo and a name are required.");
      return;
    }
    const cleanSteps = steps.filter((s) => s.text.trim());
    const payload = {
      name: name.trim(),
      imageUrl: cover,
      imageUrls: photos.slice(1),
      description: description.trim(),
      dishTypes,
      cuisine: cuisine.trim(),
      folderIds: selectedFolderIds,
      tags,
      prepTime: parseInt(prepTime) || 0,
      cookTime: parseInt(cookTime) || 0,
      servings: servings === "" ? null : parseInt(servings) || null,
      calories: calories === "" ? null : parseInt(calories) || null,
      difficulty: difficulty || null,
      source: source.trim(),
      ingredients: ingredients.filter((i) => i.name.trim()),
      steps: cleanSteps,
      instructions: stepsToInstructions(cleanSteps),
      rating,
    };

    setIsSubmitting(true);
    try {
      if (recipe) {
        await updateRecipe({ id: recipe.id, ...payload });
        toast.success("Recipe updated!");
      } else {
        await createRecipe(payload);
        toast.success("Recipe published!");
      }
      clearDraft();
      setDraftRestored(false);
      reset();
      onOpenChange(false);
    } catch {
      toast.error(`Failed to ${recipe ? "update" : "save"} recipe. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const total = totalTime({ prepTime: parseInt(prepTime) || 0, cookTime: parseInt(cookTime) || 0 });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] w-full max-w-2xl overflow-y-auto p-0">
        <div ref={scrollRef} className="px-5 pt-5 sm:px-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {importOpen ? "Create with AI" : recipe ? "Edit recipe" : "Add a recipe"}
            </DialogTitle>
          </DialogHeader>

          {/* Restored-draft banner */}
          {!importOpen && !recipe && draftRestored && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
              <span className="flex-1">Restored your unsaved draft.</span>
              <button
                type="button"
                onClick={() => {
                  clearDraft();
                  reset();
                  setDraftRestored(false);
                }}
                className="font-semibold underline"
              >
                Start fresh
              </button>
            </div>
          )}

          {importOpen ? (
            <RecipeImportPanel
              onImported={(d) => {
                applyDraft(d);
                setImportOpen(false);
              }}
              onCancel={() => setImportOpen(false)}
            />
          ) : (
            <>
              <p className="mt-1 text-sm text-zinc-500">
                Only a photo and a name are required — fill the rest now or later.
              </p>

          {/* Import with AI */}
          {!recipe && (
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-emerald-50 to-violet-50 p-3.5 text-left"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-violet-500 text-white">
                <Sparkles size={18} />
              </span>
              <span className="min-w-0">
                <span className="font-display block text-sm font-bold">Create with AI</span>
                <span className="block text-xs text-zinc-500">
                  Get recipe ideas, or import from a link or text — you review before saving.
                </span>
              </span>
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 pt-5" style={{ paddingBottom: kbPad }}>
            {/* Photos */}
            <Section icon={<Camera size={16} />} title="Photos">
              {photos.length === 0 ? (
                <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50">
                  <ImagePlus size={28} className="mb-2 text-zinc-400" />
                  <UploadButton
                    endpoint="recipeImage"
                    onClientUploadComplete={(res) =>
                      setPhotos((p) => [...p, ...res.map((r) => r.ufsUrl)])
                    }
                    onUploadError={(err) => {
                      toast.error(err.message);
                    }}
                    appearance={{
                      button: "bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg",
                      allowedContent: "text-zinc-400 text-xs mt-1",
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {photos.map((url, i) => (
                    <div
                      key={url + i}
                      className="relative h-24 w-24 overflow-hidden rounded-xl border border-zinc-200"
                    >
                      <Image src={url} alt="" fill className="object-cover" />
                      {i === 0 && (
                        <span className="absolute right-0 bottom-0 left-0 bg-black/60 py-0.5 text-center text-[10px] font-semibold text-white">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-zinc-200">
                    <UploadButton
                      endpoint="recipeImage"
                      onClientUploadComplete={(res) =>
                        setPhotos((p) => [...p, ...res.map((r) => r.ufsUrl)])
                      }
                      onUploadError={(err) => {
                      toast.error(err.message);
                    }}
                      appearance={{
                        button: "text-zinc-400 text-2xl bg-transparent",
                        allowedContent: "hidden",
                      }}
                      content={{ button: "+" }}
                    />
                  </div>
                </div>
              )}
            </Section>

            {/* Basics */}
            <Section icon={<span>📝</span>} title="The basics">
              <label className={LABEL}>
                Recipe name <span className="text-primary">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Spaghetti Carbonara"
                className={cn(FIELD, "mb-4")}
              />
              <label className={LABEL}>
                Short description <span className="font-normal text-zinc-400">— one tasty line</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Silky Roman pasta with egg yolks, pecorino and crisp pancetta…"
                className={cn(FIELD, "min-h-[96px] resize-y leading-relaxed")}
              />
            </Section>

            {/* Quick facts */}
            <Section icon={<span>⏱</span>} title="Quick facts">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Num label="Prep (min)" value={prepTime} onChange={setPrepTime} placeholder="10" />
                <Num label="Cook (min)" value={cookTime} onChange={setCookTime} placeholder="20" />
                <Num label="Servings" value={servings} onChange={setServings} placeholder="2" />
                <Num label="Calories" value={calories} onChange={setCalories} placeholder="—" />
              </div>
              <div className="bg-brand-soft text-brand-strong mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold">
                ⏱ Total time {total} min — auto-calculated
              </div>
              <div className="mt-4">
                <label className={LABEL}>Difficulty</label>
                <div className="flex overflow-hidden rounded-xl border border-zinc-200">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty((cur) => (cur === d ? "" : d))}
                      className={cn(
                        "flex-1 py-3 text-sm font-bold transition-colors",
                        difficulty === d ? "bg-primary text-primary-foreground" : "bg-white text-zinc-500"
                      )}
                    >
                      {DIFFICULTY_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {/* Categorise */}
            <Section icon={<span>🏷️</span>} title="Categorise">
              <label className={LABEL}>
                Meal type <span className="font-normal text-zinc-400">— any that apply</span>
              </label>
              <div className="mb-4 flex flex-wrap gap-2">
                {DISH_TYPES.map((t) => (
                  <Chip key={t} active={dishTypes.includes(t)} onClick={() => toggleDishType(t)}>
                    {DISH_TYPE_LABELS[t]}
                  </Chip>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>Cuisine</label>
                  <input
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    placeholder="Italian"
                    className={FIELD}
                  />
                </div>
                <div>
                  <label className={LABEL}>Your rating</label>
                  <div className="flex items-center gap-1.5 py-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                        <Star
                          size={28}
                          className={cn(
                            n <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className={LABEL}>
                  Tags <span className="font-normal text-zinc-400">— type and press enter</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="bg-brand-soft text-brand-strong inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold"
                    >
                      {t}
                      <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))}>
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        commitTag();
                      }
                    }}
                    onBlur={commitTag}
                    placeholder="add tag…"
                    className={cn(FIELD, "w-32")}
                  />
                </div>
              </div>
            </Section>

            {/* Ingredients */}
            <Section icon={<span>🥣</span>} title="Ingredients">
              <div className="space-y-2.5">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <GripVertical size={16} className="shrink-0 text-zinc-300" />
                    <input
                      value={ing.amount}
                      onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                      placeholder="200"
                      className={cn(FIELD, "w-16 px-2 text-center")}
                    />
                    <input
                      value={ing.unit}
                      onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                      placeholder="g"
                      className={cn(FIELD, "w-16 px-2 text-center")}
                    />
                    <input
                      value={ing.name}
                      onChange={(e) => updateIngredient(i, "name", e.target.value)}
                      placeholder="flour"
                      className={cn(FIELD, "flex-1")}
                    />
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(i)}
                        className="shrink-0 text-zinc-300 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <AddBtn onClick={addIngredient}>＋ Add ingredient</AddBtn>
            </Section>

            {/* Method */}
            <Section icon={<span>👩‍🍳</span>} title="Method">
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="bg-brand-soft text-brand-strong font-display mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-bold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <textarea
                        value={step.text}
                        onChange={(e) => updateStep(i, e.target.value)}
                        placeholder={`Step ${i + 1}…`}
                        className={cn(FIELD, "min-h-[72px] resize-y leading-relaxed")}
                      />
                      <div className="mt-1.5 flex items-center gap-2">
                        {step.imageUrl ? (
                          <span className="relative h-12 w-12 overflow-hidden rounded-lg border border-zinc-200">
                            <Image src={step.imageUrl} alt="" fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => setStepPhoto(i, "")}
                              className="absolute top-0 right-0 bg-black/60 p-0.5 text-white"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ) : (
                          <UploadButton
                            endpoint="recipeImage"
                            onClientUploadComplete={(res) => setStepPhoto(i, res[0]?.ufsUrl ?? "")}
                            onUploadError={(err) => {
                      toast.error(err.message);
                    }}
                            appearance={{
                              button: "text-xs text-zinc-500 border border-dashed border-zinc-300 rounded-lg px-2.5 py-1.5 bg-white",
                              allowedContent: "hidden",
                            }}
                            content={{ button: "📷 Step photo" }}
                          />
                        )}
                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(i)}
                            className="ml-auto text-zinc-300 hover:text-red-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <AddBtn onClick={addStep}>＋ Add step</AddBtn>
            </Section>

            {/* Source + folders */}
            <Section icon={<Folder size={16} />} title="Organise">
              <label className={LABEL}>
                Source <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Grandma's recipe, a cookbook, a URL…"
                className={cn(FIELD, "mb-4")}
              />
              {folders.length > 0 && (
                <>
                  <label className={LABEL}>
                    Save to folder <span className="font-normal text-zinc-400">(optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {folders.map((f) => (
                      <Chip key={f.id} active={selectedFolderIds.includes(f.id)} onClick={() => toggleFolder(f.id)}>
                        <Folder size={12} /> {f.name}
                      </Chip>
                    ))}
                  </div>
                </>
              )}
            </Section>
          </form>
            </>
          )}
        </div>

        {/* sticky footer — hidden while importing */}
        {!importOpen && (
          <div className="sticky bottom-0 flex items-center gap-2 border-t border-zinc-100 bg-white px-5 py-3.5 sm:px-6">
            <button
              type="button"
              onClick={requestClose}
              className="px-3 py-2 text-sm font-semibold text-zinc-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!photos[0] || !name.trim() || isSubmitting}
              className="bg-primary text-primary-foreground ml-auto rounded-xl px-6 py-3 text-sm font-bold disabled:opacity-50"
            >
              {isSubmitting
                ? recipe
                  ? "Updating…"
                  : "Publishing…"
                : recipe
                  ? "Update recipe"
                  : "Publish recipe ✓"}
            </button>
          </div>
        )}

        {/* Confirm-on-close — plain overlay, NOT a nested modal */}
        {confirmClose && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <h3 className="font-display text-lg font-bold text-zinc-900">Keep your changes?</h3>
              <p className="mt-1 text-sm text-zinc-500">
                You have unsaved edits. Save them as a draft so you can finish later, or discard.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                {!recipe && (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.setItem(DRAFT_KEY, draftJson);
                      } catch {
                        /* ignore */
                      }
                      toast.success("Saved as draft.");
                      doClose();
                    }}
                    className="bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold"
                  >
                    Save as draft &amp; close
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmClose(false)}
                  className="rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700"
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearDraft();
                    setDraftRestored(false);
                    reset();
                    doClose();
                  }}
                  className="py-2 text-sm font-semibold text-red-500"
                >
                  Discard changes
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── small presentational helpers ────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3.5 flex items-center gap-2 text-xs font-bold tracking-wide text-zinc-400 uppercase">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={FIELD}
      />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
      )}
    >
      {children}
    </button>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-brand-soft text-brand-strong mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold"
    >
      <Plus size={15} /> {children}
    </button>
  );
}
