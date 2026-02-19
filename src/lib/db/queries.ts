import "server-only";

import { desc } from "drizzle-orm";
import { db } from "./index";
import { folders, recipes } from "./schema";

export async function getRecipes() {
  return db.select().from(recipes).orderBy(desc(recipes.createdAt));
}

export async function getFolders() {
  return db.select().from(folders).orderBy(desc(folders.createdAt));
}
