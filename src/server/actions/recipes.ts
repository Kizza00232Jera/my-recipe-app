"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { getOrCreateUser } from "@/lib/db/queries";
import type { DishType } from "@/lib/db/schema";

type CreateRecipeInput = {
  name: string;
  imageUrl: string;
  dishType: DishType;
  tags: string[];
  prepTime: number;
  cookTime: number;
  ingredients: { amount: string; unit: string; name: string }[];
  instructions: string;
  rating: number;
};

export async function createRecipe(input: CreateRecipeInput) {
  try {
    throw new Error("Sentry test — delete me");
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const dbUser = await getOrCreateUser(
      clerkUser.id,
      clerkUser.emailAddresses[0]?.emailAddress ?? ""
    );

    await db.insert(recipes).values({
      id: createId(),
      userId: dbUser.id,
      folderId: null,
      ...input,
    });

    revalidatePath("/");
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}
