"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { getOrCreateUser } from "@/lib/db/queries";
import { uploadRatelimit, deleteRatelimit } from "@/lib/ratelimit";
import type { DishType } from "@/lib/db/schema";

type CreateRecipeInput = {
  name: string;
  imageUrl: string;
  dishTypes: DishType[];
  tags: string[];
  prepTime: number;
  cookTime: number;
  ingredients: { amount: string; unit: string; name: string }[];
  instructions: string;
  rating: number;
  folderIds?: string[];
};

export async function createRecipe(input: CreateRecipeInput) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const { success } = await uploadRatelimit.limit(clerkUser.id);
    if (!success) throw new Error("Too many uploads. Please try again later.");

    const dbUser = await getOrCreateUser(
      clerkUser.id,
      clerkUser.emailAddresses[0]?.emailAddress ?? ""
    );

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
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const { success } = await deleteRatelimit.limit(clerkUser.id);
    if (!success) throw new Error("Too many deletes. Please try again later.");

    const dbUser = await getOrCreateUser(
      clerkUser.id,
      clerkUser.emailAddresses[0]?.emailAddress ?? ""
    );

    await db
      .delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, dbUser.id)));

    revalidatePath("/");
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

type UpdateRecipeInput = {
  id: string;
  name: string;
  imageUrl: string;
  dishTypes: DishType[];
  tags: string[];
  prepTime: number;
  cookTime: number;
  ingredients: { amount: string; unit: string; name: string }[];
  instructions: string;
  rating: number;
  folderIds?: string[];
};

export async function updateRecipe(input: UpdateRecipeInput) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const { success } = await uploadRatelimit.limit(clerkUser.id);
    if (!success) throw new Error("Too many requests. Please try again later.");

    const dbUser = await getOrCreateUser(
      clerkUser.id,
      clerkUser.emailAddresses[0]?.emailAddress ?? ""
    );

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
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const dbUser = await getOrCreateUser(
      clerkUser.id,
      clerkUser.emailAddresses[0]?.emailAddress ?? ""
    );

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
