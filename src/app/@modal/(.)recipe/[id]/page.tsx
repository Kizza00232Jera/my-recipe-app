import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getOrCreateUser, getRecipeById } from "@/lib/db/queries";
import { RecipeModal } from "@/components/recipe-modal";

export default async function RecipeModalPage({
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

  const recipe = await getRecipeById(id, dbUser.id);
  if (!recipe) notFound();

  return <RecipeModal recipe={recipe} />;
}
