"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAmount, scaleAmount } from "@/lib/recipe-utils";
import type { Ingredient, Step } from "@/lib/db/schema";

type Props = {
  ingredients: Ingredient[];
  steps: Step[];
  baseServings: number | null;
};

export function RecipeMethod({ ingredients, steps, baseServings }: Props) {
  const [tab, setTab] = useState<"ingredients" | "method">("ingredients");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [servings, setServings] = useState<number | null>(baseServings);

  const factor = baseServings && servings ? servings / baseServings : 1;

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  // group ingredients by optional `group` label, preserving order
  const groups: { label: string | null; items: { ing: Ingredient; idx: number }[] }[] = [];
  ingredients.forEach((ing, idx) => {
    const label = ing.group?.trim() || null;
    let g = groups.find((x) => x.label === label);
    if (!g) {
      g = { label, items: [] };
      groups.push(g);
    }
    g.items.push({ ing, idx });
  });

  return (
    <div>
      {/* Tabs */}
      <div className="mb-5 flex gap-2">
        {(["ingredients", "method"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-bold capitalize transition-colors",
              tab === t ? "bg-primary text-primary-foreground" : "bg-zinc-100 text-zinc-600"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "ingredients" && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
          {/* Servings scaler — only when we know the base servings */}
          {baseServings ? (
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-4">
              <span className="text-sm font-semibold text-zinc-700">Servings</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setServings((s) => Math.max(1, (s ?? baseServings) - 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  aria-label="Fewer servings"
                >
                  <Minus size={15} />
                </button>
                <span className="w-8 text-center text-sm font-bold">{servings}</span>
                <button
                  onClick={() => setServings((s) => (s ?? baseServings) + 1)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  aria-label="More servings"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          ) : null}

          <ul className="space-y-1">
            {groups.map((g, gi) => (
              <li key={gi}>
                {g.label && (
                  <p className="text-brand-strong mt-3 mb-1 text-xs font-bold tracking-wide uppercase first:mt-0">
                    {g.label}
                  </p>
                )}
                <ul>
                  {g.items.map(({ ing, idx }) => {
                    const amt = formatAmount({ ...ing, amount: scaleAmount(ing.amount, factor) });
                    const isChecked = checked.has(idx);
                    return (
                      <li key={idx}>
                        <button
                          onClick={() => toggle(idx)}
                          className="flex w-full items-start gap-3 py-2 text-left"
                        >
                          <span
                            className={cn(
                              "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors",
                              isChecked
                                ? "border-primary bg-primary text-white"
                                : "border-zinc-300"
                            )}
                          >
                            {isChecked && <Check size={13} strokeWidth={3} />}
                          </span>
                          <span
                            className={cn(
                              "text-[15px] text-zinc-700",
                              isChecked && "text-zinc-400 line-through"
                            )}
                          >
                            {amt && <span className="font-semibold text-zinc-900">{amt} </span>}
                            {ing.name}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "method" && (
        <ol className="space-y-4">
          {steps.length === 0 && (
            <li className="text-sm text-zinc-400">No method added yet.</li>
          )}
          {steps.map((step, i) => (
            <li key={i} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
              <span className="bg-brand-soft text-brand-strong font-display grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-bold">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-relaxed text-zinc-700">{step.text}</p>
                {step.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={step.imageUrl}
                    alt={`Step ${i + 1}`}
                    className="mt-3 max-h-56 w-full rounded-xl object-cover"
                  />
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
