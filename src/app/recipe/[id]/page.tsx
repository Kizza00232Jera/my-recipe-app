import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getFolders, getOrCreateUser, getRecipeById } from "@/lib/db/queries";
import { RecipeDetail } from "@/components/recipe-detail";
import { DeleteRecipeButton } from "@/components/delete-recipe-button";
import { EditRecipeButton } from "@/components/edit-recipe-button";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const clerkUser = await currentUser();
  const dbUser = await getOrCreateUser(
    clerkUser!.id,
    clerkUser!.emailAddresses[0]?.emailAddress ?? ""
  );

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
        <RecipeDetail recipe={recipe} />
        <div className="mt-8 flex items-center gap-3 border-t border-zinc-200 pt-6">
          <EditRecipeButton recipe={recipe} folders={folders} />
          <DeleteRecipeButton recipeId={recipe.id} />
        </div>
      </div>
    </div>
  );
}
