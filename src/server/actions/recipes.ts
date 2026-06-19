"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { getOrCreateUser, getUserByClerkId } from "@/lib/db/queries";
import { uploadRatelimit, deleteRatelimit } from "@/lib/ratelimit";
import type { DishType, Difficulty, Ingredient, Step } from "@/lib/db/schema";

// Resolve the current user with a single indexed SELECT (no Clerk API call).
// Only falls back to currentUser() on first-ever login to create the row.
async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  let dbUser = await getUserByClerkId(userId);
  if (!dbUser) {
    const cu = await currentUser();
    dbUser = await getOrCreateUser(userId, cu?.emailAddresses[0]?.emailAddress ?? "");
  }
  return { clerkId: userId, dbUser };
}

type RecipeFields = {
  name: string;
  imageUrl: string;
  imageUrls?: string[];
  dishTypes: DishType[];
  tags: string[];
  prepTime: number;
  cookTime: number;
  ingredients: Ingredient[];
  instructions: string;
  steps?: Step[];
  rating: number;
  description?: string;
  servings?: number | null;
  difficulty?: Difficulty | null;
  cuisine?: string;
  calories?: number | null;
  source?: string;
  folderIds?: string[];
};

type CreateRecipeInput = RecipeFields;

export async function createRecipe(input: CreateRecipeInput) {
  try {
    const { clerkId, dbUser } = await requireUser();

    const { success } = await uploadRatelimit.limit(clerkId);
    if (!success) throw new Error("Too many uploads. Please try again later.");

    await db.insert(recipes).values({
      id: createId(),
      userId: dbUser.id,
      folderIds: input.folderIds ?? [],
      ...input,
    });

    revalidatePath("/");
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

export async function deleteRecipe(id: string) {
  try {
    const { clerkId, dbUser } = await requireUser();

    const { success } = await deleteRatelimit.limit(clerkId);
    if (!success) throw new Error("Too many deletes. Please try again later.");

    await db
      .delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, dbUser.id)));

    revalidatePath("/");
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

type UpdateRecipeInput = RecipeFields & { id: string };

export async function updateRecipe(input: UpdateRecipeInput) {
  try {
    const { clerkId, dbUser } = await requireUser();

    const { success } = await uploadRatelimit.limit(clerkId);
    if (!success) throw new Error("Too many requests. Please try again later.");

    const { id, ...data } = input;

    await db
      .update(recipes)
      .set({ ...data, folderIds: data.folderIds ?? [] })
      .where(and(eq(recipes.id, id), eq(recipes.userId, dbUser.id)));

    revalidatePath("/");
    revalidatePath(`/recipe/${id}`);
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

export async function addRecipesToFolder(ids: string[], folderId: string) {
  try {
    const { dbUser } = await requireUser();

    // Append folderId to folderIds array, skipping if already present
    await db
      .update(recipes)
      .set({
        folderIds: sql`
          CASE WHEN ${folderId}::text = ANY(folder_ids)
          THEN folder_ids
          ELSE array_append(folder_ids, ${folderId}::text)
          END
        `,
      })
      .where(and(inArray(recipes.id, ids), eq(recipes.userId, dbUser.id)));

    revalidatePath("/");
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}
