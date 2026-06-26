import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getFolders, getOrCreateUser, getRecipeById, getUserByClerkId } from "@/lib/db/queries";
import { RecipeDetail } from "@/components/recipe-detail";
import { DeleteRecipeButton } from "@/components/delete-recipe-button";
import { EditRecipeButton } from "@/components/edit-recipe-button";
import { EnhanceWithAiButton } from "@/components/enhance-with-ai-button";
import { DemoBanner } from "@/components/demo-banner";
import { DEMO_RECIPES } from "@/lib/demo-data";
import { isSparse } from "@/lib/recipe-utils";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId } = await auth();

  // Guest / demo path — serve from static demo data, no DB call
  if (!userId) {
    const recipe = DEMO_RECIPES.find((r) => r.id === id) ?? null;
    if (!recipe) notFound();

    return (
      <div className="min-h-screen bg-zinc-50">
        <DemoBanner />
        <div className="mx-auto max-w-2xl px-6 py-8">
          <Link
            href="/"
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

  // Authenticated path — fast user lookup, no Clerk API round-trip
  let dbUser = await getUserByClerkId(userId);
  if (!dbUser) {
    const clerkUser = await currentUser();
    dbUser = await getOrCreateUser(
      clerkUser!.id,
      clerkUser!.emailAddresses[0]?.emailAddress ?? ""
    );
  }

  const [recipe, folders] = await Promise.all([
    getRecipeById(id, dbUser.id),
    getFolders(dbUser.id),
  ]);
  if (!recipe) notFound();

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft size={16} />
          Back to recipes
        </Link>
        <RecipeDetail
          recipe={recipe}
          enhanceSlot={
            isSparse(recipe) ? (
              <EnhanceWithAiButton recipe={recipe} folders={folders} />
            ) : undefined
          }
        />
        <div className="mt-8 flex flex-col gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
          <EditRecipeButton recipe={recipe} folders={folders} />
          <DeleteRecipeButton recipeId={recipe.id} />
        </div>
      </div>
    </div>
  );
}
