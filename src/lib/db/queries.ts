import "server-only";

import { desc, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "./index";
import { folders, recipes, users } from "./schema";

export async function getOrCreateUser(clerkId: string, email: string) {
  const existing = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (existing.length > 0) return existing[0];

  const [newUser] = await db
    .insert(users)
    .values({ id: createId(), clerkId, email })
    .returning();
  return newUser;
}

export async function getRecipes(userId: string) {
  return db
    .select()
    .from(recipes)
    .where(eq(recipes.userId, userId))
    .orderBy(desc(recipes.createdAt));
}

export async function getFolders(userId: string) {
  return db
    .select()
    .from(folders)
    .where(eq(folders.userId, userId))
    .orderBy(desc(folders.createdAt));
}
