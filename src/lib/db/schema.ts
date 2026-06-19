import { pgTable, real, integer, json, text, timestamp } from "drizzle-orm/pg-core";

export const DISH_TYPES = [
  "lunch",
  "dinner",
  "breakfast",
  "side",
  "appetizer",
  "snack",
  "sauce",
  "drinks",
  "vegan",
] as const;

export type DishType = (typeof DISH_TYPES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type Ingredient = { amount: string; unit: string; name: string; group?: string };
export type Step = { text: string; imageUrl?: string };

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const folders = pgTable("folders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipes = pgTable("recipes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  folderIds: text("folder_ids").array().notNull().default([]),
  name: text("name").notNull(),
  // Cover image + optional gallery of extra photos
  imageUrl: text("image_url").notNull(),
  imageUrls: text("image_urls").array().notNull().default([]),
  dishTypes: text("dish_types").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  prepTime: integer("prep_time").notNull(),
  cookTime: integer("cook_time").notNull(),
  ingredients: json("ingredients").notNull().$type<Ingredient[]>(),
  // Legacy single-string instructions — kept as a fallback. New recipes use steps[].
  instructions: text("instructions").notNull().default(""),
  steps: json("steps").notNull().$type<Step[]>().default([]),
  rating: real("rating").notNull().default(0),
  // ── Fields added in the Foodie redesign. All optional / defaulted so existing
  //    recipes stay valid and render without "missing value" placeholders. ──
  description: text("description").notNull().default(""),
  servings: integer("servings"), // nullable
  difficulty: text("difficulty").$type<Difficulty>(), // nullable
  cuisine: text("cuisine").notNull().default(""),
  calories: integer("calories"), // nullable
  source: text("source").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inferred types — use these everywhere instead of the mock-data types
export type Recipe = typeof recipes.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type User = typeof users.$inferSelect;
