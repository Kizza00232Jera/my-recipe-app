import { pgEnum, pgTable, integer, json, text, timestamp } from "drizzle-orm/pg-core";

export const dishTypeEnum = pgEnum("dish_type", [
  "main",
  "dessert",
  "pizza",
  "grill",
  "soup",
  "salad",
  "breakfast",
  "other",
]);

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
  folderId: text("folder_id").references(() => folders.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  dishType: dishTypeEnum("dish_type").notNull(),
  tags: text("tags").array().notNull().default([]),
  prepTime: integer("prep_time").notNull(),
  cookTime: integer("cook_time").notNull(),
  ingredients: json("ingredients")
    .notNull()
    .$type<{ amount: string; unit: string; name: string }[]>(),
  instructions: text("instructions").notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inferred types — use these everywhere instead of the mock-data types
export type Recipe = typeof recipes.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type User = typeof users.$inferSelect;
export type DishType = (typeof dishTypeEnum.enumValues)[number];
