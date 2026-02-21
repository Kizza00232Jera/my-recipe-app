import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getDemoUser, getRecipeById } from "@/lib/db/queries";
import { RecipeDetail } from "@/components/recipe-detail";
import { DemoBanner } from "@/components/demo-banner";
import { DEMO_RECIPES } from "@/lib/demo-data";

export default async function DemoRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const clerkId = process.env.DEMO_CLERK_ID;
  let recipe = null;

  if (clerkId) {
    const owner = await getDemoUser(clerkId);
    if (owner) {
      recipe = await getRecipeById(id, owner.id);
    }
  }

  // Fallback: check static mock data
  if (!recipe) {
    recipe = DEMO_RECIPES.find((r) => r.id === id) ?? null;
  }

  if (!recipe) notFound();

  return (
    <div className="min-h-screen bg-zinc-50">
      <DemoBanner />
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Link
          href="/demo"
          className="mb-6 flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft size={16} />
          Back to recipes
        </Link>
        <RecipeDetail recipe={recipe} />
      </div>
    </div>
  );
}
