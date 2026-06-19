import "server-only";

import { and, desc, eq } from "drizzle-orm";
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

// Fast lookup by Clerk ID — a single indexed SELECT, no Clerk API round-trip.
// Use this on hot paths (page loads); only fall back to currentUser() +
// getOrCreateUser when the row doesn't exist yet (first ever login).
export async function getUserByClerkId(clerkId: string) {
  const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return result[0] ?? null;
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

export async function getRecipeById(id: string, userId: string) {
  const result = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

// Read-only lookup by Clerk ID — does NOT create a user if missing
export async function getDemoUser(clerkId: string) {
  const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return result[0] ?? null;
}
