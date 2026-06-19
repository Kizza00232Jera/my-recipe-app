"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, Lightbulb, Loader2, Settings2, Sparkles } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing-client";
import { generateRecipe, importRecipe, suggestRecipeIdeas } from "@/server/actions/import";
import {
  activeKey,
  loadSettings,
  saveSettings,
  type AiSettings,
} from "@/lib/ai/settings";
import { AI_PROVIDERS, DEFAULT_MODEL, PROVIDER_IDS, modelLabel, type ProviderId } from "@/lib/ai/models";
import type { DishType } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Field, ImportDraft, ImportResult, Provenance, RecipeIdea } from "@/lib/ai/types";

const IDEA_MEALS: DishType[] = ["breakfast", "lunch", "dinner", "snack", "drinks", "vegan"];
const MEAL_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Dessert / snack",
  drinks: "Drinks",
  vegan: "Vegan",
};

/**
 * Inline import flow rendered INSIDE the editor dialog (no nested modal — that
 * caused the editor to close on mobile). States: input → settings → loading →
 * review. On accept it hands a flat draft back to the editor form.
 */
export function RecipeImportPanel({
  onImported,
  onCancel,
}: {
  onImported: (draft: ImportDraft) => void;
  onCancel: () => void;
}) {
  const [settings, setSettings] = useState<AiSettings>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<"ideas" | "link" | "text">("ideas");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [cover, setCover] = useState("");

  // ideas mode
  const [ideaQuery, setIdeaQuery] = useState("");
  const [mealType, setMealType] = useState<DishType | "">("");
  const [simple, setSimple] = useState(false);
  const [ideas, setIdeas] = useState<RecipeIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [genTitle, setGenTitle] = useState<string | null>(null);

  const keyLabel = `${cap(settings.provider)} · ${modelLabel(settings.provider, settings.model)}`;

  function patchSettings(next: AiSettings) {
    setSettings(next);
    saveSettings(next);
  }

  async function runImport() {
    if (!activeKey(settings)) {
      toast.message("Add your API key first");
      setShowSettings(true);
      return;
    }
    if (!content.trim()) {
      toast.error(mode === "link" ? "Paste a URL first." : "Paste some text first.");
      return;
    }
    setLoading(true);
    try {
      const res = await importRecipe({
        mode: mode === "link" ? "link" : "text",
        content: content.trim(),
        provider: settings.provider,
        apiKey: activeKey(settings),
        model: settings.model,
        unsplashKey: settings.unsplashKey || undefined,
        imageMode: settings.imageMode,
      });
      setResult(res);
      setCover(res.image.url ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  async function getIdeas() {
    if (!activeKey(settings)) {
      toast.message("Add your API key first");
      setShowSettings(true);
      return;
    }
    if (!ideaQuery.trim()) {
      toast.error("Tell me what you feel like cooking.");
      return;
    }
    setIdeasLoading(true);
    setIdeas([]);
    try {
      const res = await suggestRecipeIdeas({
        query: ideaQuery.trim(),
        mealType: mealType ? MEAL_LABEL[mealType] : undefined,
        simple,
        provider: settings.provider,
        apiKey: activeKey(settings),
        model: settings.model,
      });
      setIdeas(res.ideas);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't get ideas.");
    } finally {
      setIdeasLoading(false);
    }
  }

  async function pickIdea(title: string) {
    setGenTitle(title);
    try {
      const res = await generateRecipe({
        title,
        query: ideaQuery.trim() || undefined,
        provider: settings.provider,
        apiKey: activeKey(settings),
        model: settings.model,
        unsplashKey: settings.unsplashKey || undefined,
        imageMode: settings.imageMode,
      });
      setResult(res);
      setCover(res.image.url ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate the recipe.");
    } finally {
      setGenTitle(null);
    }
  }

  function accept() {
    if (!result) return;
    const r = result.recipe;
    onImported({
      name: r.name.value,
      description: r.description.value,
      dishTypes: r.dishTypes.value,
      cuisine: r.cuisine.value,
      tags: r.tags.value,
      prepTime: r.prepTime.value,
      cookTime: r.cookTime.value,
      servings: r.servings.value,
      difficulty: r.difficulty.value,
      calories: r.calories.value,
      ingredients: r.ingredients.map((i) => i.value),
      steps: r.steps.map((s) => s.value),
      imageUrl: cover,
    });
  }

  return (
    <div className="pt-3 pb-6">
      {/* top bar */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={result ? () => setResult(null) : onCancel}
          className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500"
        >
          <ChevronLeft size={16} /> {result ? "Back" : "Back to form"}
        </button>
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold",
            showSettings ? "border-primary text-primary" : "border-zinc-200 text-zinc-600"
          )}
        >
          <Settings2 size={13} /> {keyLabel}
        </button>
      </div>

      {showSettings && (
        <SettingsCard
          settings={settings}
          onChange={patchSettings}
          onDone={() => setShowSettings(false)}
        />
      )}

      {!showSettings && !result && (
        <div className="space-y-3">
          {/* mode tabs */}
          <div className="inline-flex rounded-xl bg-zinc-100 p-1">
            {(
              [
                ["ideas", "💡 Ideas"],
                ["link", "🔗 Link"],
                ["text", "📝 Text"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  mode === m ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "ideas" ? (
            <div className="space-y-3">
              <textarea
                value={ideaQuery}
                onChange={(e) => setIdeaQuery(e.target.value)}
                rows={3}
                placeholder="What do you feel like cooking? e.g. simple chicken dinner, pancakes with fruit, something with fish"
                className="focus:border-primary w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-base leading-relaxed outline-none focus:bg-white"
              />

              <div className="flex flex-wrap gap-2">
                {IDEA_MEALS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMealType((c) => (c === m ? "" : m))}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      mealType === m
                        ? "border-primary bg-brand-soft text-brand-strong"
                        : "border-zinc-200 text-zinc-600"
                    )}
                  >
                    {MEAL_LABEL[m]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSimple((s) => !s)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    simple
                      ? "border-primary bg-brand-soft text-brand-strong"
                      : "border-zinc-200 text-zinc-600"
                  )}
                >
                  ⚡ Keep it simple
                </button>
              </div>

              <button
                type="button"
                onClick={getIdeas}
                disabled={ideasLoading}
                className="bg-primary text-primary-foreground inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold disabled:opacity-60"
              >
                {ideasLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Thinking of ideas…
                  </>
                ) : (
                  <>
                    <Lightbulb size={16} /> Get 3 ideas
                  </>
                )}
              </button>

              {ideas.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold text-zinc-400">
                    Pick one to generate the full recipe:
                  </p>
                  {ideas.map((idea, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => pickIdea(idea.title)}
                      disabled={!!genTitle}
                      className="hover:border-primary flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 text-left transition-colors disabled:opacity-60"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="font-display block text-sm font-bold text-zinc-900">
                          {idea.title}
                        </span>
                        {idea.blurb && (
                          <span className="block text-xs text-zinc-500">{idea.blurb}</span>
                        )}
                      </span>
                      {genTitle === idea.title ? (
                        <Loader2 size={16} className="text-primary animate-spin" />
                      ) : (
                        <span className="text-primary shrink-0 text-sm font-bold">Generate →</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs leading-relaxed text-zinc-400">
                Token-light: you get 3 titles first. The full recipe is only generated for the one
                you pick — then it finds a photo and fills every field for you to review.
              </p>
            </div>
          ) : (
            <>
              {mode === "link" ? (
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="https://… recipe page, blog, or Instagram post URL"
                  className="focus:border-primary w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-base outline-none focus:bg-white"
                />
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  placeholder="Paste the recipe text, a note, or a message from a friend…"
                  className="focus:border-primary w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-base leading-relaxed outline-none focus:bg-white"
                />
              )}

              <p className="text-xs leading-relaxed text-zinc-400">
                AI fills what it can read, then researches the gaps. Nothing is published — you
                review everything next. Instagram only exposes its caption text reliably.
              </p>

              <button
                type="button"
                onClick={runImport}
                disabled={loading}
                className="bg-primary text-primary-foreground inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Reading &amp; researching…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Import &amp; review
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {!showSettings && result && (
        <Review result={result} cover={cover} onCover={setCover} onAccept={accept} />
      )}
    </div>
  );
}

// ── settings (inline) ───────────────────────────────────────────────────────

function SettingsCard({
  settings,
  onChange,
  onDone,
}: {
  settings: AiSettings;
  onChange: (s: AiSettings) => void;
  onDone: () => void;
}) {
  const provider = settings.provider;
  const meta = AI_PROVIDERS[provider];

  function setProvider(p: ProviderId) {
    const keep = AI_PROVIDERS[p].models.some((m) => m.id === settings.model)
      ? settings.model
      : DEFAULT_MODEL[p];
    onChange({ ...settings, provider: p, model: keep });
  }

  return (
    <div className="mb-4 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-sm leading-relaxed text-zinc-500">
        Bring your own key — imports run on <b>your</b> credits. Stored only on this device, never on
        our servers.
      </p>

      <div>
        <label className="mb-2 block text-sm font-semibold text-zinc-700">AI provider</label>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDER_IDS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold",
                provider === p
                  ? "border-primary bg-brand-soft text-brand-strong"
                  : "border-zinc-200 text-zinc-600"
              )}
            >
              <span>{AI_PROVIDERS[p].emoji}</span>
              {AI_PROVIDERS[p].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-zinc-700">API key</label>
        <input
          type="password"
          autoComplete="off"
          value={settings.keys[provider] ?? ""}
          onChange={(e) => onChange({ ...settings, keys: { ...settings.keys, [provider]: e.target.value } })}
          placeholder={meta.keyPlaceholder}
          className="focus:border-primary w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-base outline-none focus:bg-white"
        />
        <p className="mt-1.5 text-xs text-zinc-400">
          Get a key at <span className="text-brand-strong font-medium">{meta.keyUrl}</span>.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-zinc-700">Model</label>
        <select
          value={settings.model}
          onChange={(e) => onChange({ ...settings, model: e.target.value })}
          className="focus:border-primary w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-base outline-none focus:bg-white"
        >
          {meta.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-zinc-700">
          Unsplash key <span className="font-normal text-zinc-400">(optional — cover photos)</span>
        </label>
        <input
          type="password"
          autoComplete="off"
          value={settings.unsplashKey}
          onChange={(e) => onChange({ ...settings, unsplashKey: e.target.value })}
          placeholder="Unsplash Access Key"
          className="focus:border-primary w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-base outline-none focus:bg-white"
        />
      </div>

      <button
        type="button"
        onClick={onDone}
        className="bg-primary text-primary-foreground w-full rounded-xl py-3 text-sm font-bold"
      >
        Done
      </button>
    </div>
  );
}

// ── review ───────────────────────────────────────────────────────────────────

function Review({
  result,
  cover,
  onCover,
  onAccept,
}: {
  result: ImportResult;
  cover: string;
  onCover: (v: string) => void;
  onAccept: () => void;
}) {
  const r = result.recipe;
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm">
        Imported from <b>{result.sourceLabel}</b> · parsed with <b>{result.modelLabel}</b>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
        <Dot color="bg-primary" label="From your link/text" />
        <Dot color="bg-violet-accent" label="Added by AI (researched / inferred)" />
      </div>
      <div className="text-violet-accent rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs leading-relaxed">
        ✦ Nothing is saved yet. Tap <b>Use this recipe</b> to drop it into the form, then publish.
      </div>

      {/* cover */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200">
        <div className="relative aspect-video w-full bg-zinc-100">
          {cover ? (
            <Image src={cover} alt="cover" fill className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-zinc-400">
              No photo found — upload one
            </div>
          )}
          <span
            className={cn(
              "absolute top-2 left-2 rounded-full px-2.5 py-1 text-[11px] font-bold text-white",
              result.image.source === "source" ? "bg-primary" : "bg-violet-accent"
            )}
          >
            {result.image.source === "source"
              ? "✓ from source"
              : result.image.source === "ai"
                ? "✦ AI · Unsplash"
                : "no image"}
          </span>
        </div>
        <div className="flex justify-end bg-zinc-50 p-2.5">
          <UploadButton
            endpoint="recipeImage"
            onClientUploadComplete={(res) => onCover(res[0]?.ufsUrl ?? cover)}
            onUploadError={(e) => {
              toast.error(e.message);
            }}
            appearance={{
              button: "bg-white border border-zinc-200 text-zinc-700 text-xs px-3 py-2 rounded-lg",
              allowedContent: "hidden",
            }}
            content={{ button: "Upload my own" }}
          />
        </div>
      </div>

      <ReviewField label="Name" field={r.name} />
      <ReviewField label="Description" field={r.description} />

      <div className="grid grid-cols-3 gap-2">
        <FactTile label="Prep" field={r.prepTime} suffix="m" />
        <FactTile label="Cook" field={r.cookTime} suffix="m" />
        <FactTile label="Serves" field={r.servings} />
        <FactTile label="Level" field={r.difficulty} />
        <FactTile label="kcal" field={r.calories} />
        <FactTile label="Cuisine" field={r.cuisine} />
      </div>

      <div>
        <h4 className="mb-2 text-xs font-bold tracking-wide text-zinc-400 uppercase">Ingredients</h4>
        <div className="space-y-1.5">
          {r.ingredients.map((i, idx) => (
            <LineRow key={idx} source={i.source}>
              {[i.value.amount, i.value.unit].filter(Boolean).join(" ")} {i.value.name}
            </LineRow>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-bold tracking-wide text-zinc-400 uppercase">Method</h4>
        <div className="space-y-1.5">
          {r.steps.map((st, idx) => (
            <LineRow key={idx} source={st.source}>
              <b className="mr-1">{idx + 1}.</b>
              {st.value.text}
            </LineRow>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onAccept}
        className="bg-primary text-primary-foreground w-full rounded-xl px-5 py-3.5 text-sm font-bold"
      >
        Use this recipe →
      </button>
    </div>
  );
}

function badgeClass(s: Provenance) {
  return s === "source" ? "bg-brand-soft text-brand-strong" : "bg-violet-soft text-violet-accent";
}

function ReviewField({ label, field }: { label: string; field: Field<string> }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3.5",
        field.source === "source" ? "border-l-primary border-l-4" : "border-l-violet-accent border-l-4"
      )}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-xs font-bold text-zinc-600">{label}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", badgeClass(field.source))}>
          {field.source === "source" ? "✓ your source" : "✦ AI"}
        </span>
      </div>
      <p className="text-sm text-zinc-800">{field.value || <span className="text-zinc-400">—</span>}</p>
      {field.note && <p className="text-violet-accent mt-1 text-xs">✦ {field.note}</p>}
    </div>
  );
}

function FactTile({
  label,
  field,
  suffix = "",
}: {
  label: string;
  field: Field<string | number | null>;
  suffix?: string;
}) {
  const val = field.value == null || field.value === "" ? "—" : `${field.value}${suffix}`;
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-2.5 text-center",
        field.source === "source" ? "border-t-primary border-t-4" : "border-t-violet-accent border-t-4"
      )}
    >
      <div className="font-display text-base font-bold text-zinc-900 capitalize">{val}</div>
      <div className="text-[10px] text-zinc-400">{label}</div>
    </div>
  );
}

function LineRow({ source, children }: { source: Provenance; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-zinc-700",
        source === "source" ? "border-l-primary border-l-4" : "border-l-violet-accent border-l-4"
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", badgeClass(source))}>
        {source === "source" ? "source" : "AI"}
      </span>
    </div>
  );
}

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-sm", color)} />
      {label}
    </span>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
