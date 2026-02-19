export type DishType =
  | "main"
  | "dessert"
  | "pizza"
  | "grill"
  | "soup"
  | "salad"
  | "breakfast"
  | "other";

export type Recipe = {
  id: string;
  name: string;
  imageUrl: string;
  dishType: DishType;
  tags: string[];
  prepTime: number;
  cookTime: number;
  ingredients: { amount: string; unit: string; name: string }[];
  instructions: string;
  rating: number;
  folderId: string | null;
  createdAt: string;
};

export type Folder = {
  id: string;
  name: string;
  createdAt: string;
};

export const MOCK_FOLDERS: Folder[] = [
  { id: "f1", name: "Weeknight Dinners", createdAt: "2024-01-01" },
  { id: "f2", name: "Sunday BBQ", createdAt: "2024-01-02" },
  { id: "f3", name: "Sweet Treats", createdAt: "2024-01-03" },
];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: "r1",
    name: "Spaghetti Carbonara",
    imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80",
    dishType: "main",
    tags: ["pasta", "quick", "italian"],
    prepTime: 10,
    cookTime: 20,
    rating: 5,
    folderId: "f1",
    createdAt: "2024-02-10",
    ingredients: [
      { amount: "400", unit: "g", name: "spaghetti" },
      { amount: "200", unit: "g", name: "pancetta" },
      { amount: "4", unit: "", name: "egg yolks" },
      { amount: "100", unit: "g", name: "pecorino romano" },
    ],
    instructions: "Boil pasta. Fry pancetta. Mix yolks with cheese. Combine off heat.",
  },
  {
    id: "r2",
    name: "Grilled Ribeye Steak",
    imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80",
    dishType: "grill",
    tags: ["beef", "steak", "protein"],
    prepTime: 5,
    cookTime: 15,
    rating: 5,
    folderId: "f2",
    createdAt: "2024-02-15",
    ingredients: [
      { amount: "2", unit: "", name: "ribeye steaks" },
      { amount: "2", unit: "tbsp", name: "olive oil" },
      { amount: "1", unit: "tsp", name: "sea salt" },
      { amount: "1", unit: "tsp", name: "black pepper" },
    ],
    instructions: "Season steaks. Grill 4 min per side for medium-rare. Rest 5 min.",
  },
  {
    id: "r3",
    name: "Chocolate Lava Cake",
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80",
    dishType: "dessert",
    tags: ["chocolate", "baking", "indulgent"],
    prepTime: 15,
    cookTime: 12,
    rating: 4,
    folderId: "f3",
    createdAt: "2024-02-20",
    ingredients: [
      { amount: "200", unit: "g", name: "dark chocolate" },
      { amount: "100", unit: "g", name: "butter" },
      { amount: "4", unit: "", name: "eggs" },
      { amount: "60", unit: "g", name: "sugar" },
    ],
    instructions:
      "Melt chocolate and butter. Whisk eggs and sugar. Combine and bake at 220°C for 12 min.",
  },
  {
    id: "r4",
    name: "Margherita Pizza",
    imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
    dishType: "pizza",
    tags: ["italian", "vegetarian", "classic"],
    prepTime: 30,
    cookTime: 12,
    rating: 5,
    folderId: null,
    createdAt: "2024-03-01",
    ingredients: [
      { amount: "250", unit: "g", name: "pizza dough" },
      { amount: "100", unit: "ml", name: "tomato sauce" },
      { amount: "150", unit: "g", name: "fresh mozzarella" },
      { amount: "10", unit: "", name: "basil leaves" },
    ],
    instructions:
      "Roll dough. Spread sauce. Add mozzarella. Bake at 250°C for 10-12 min. Top with basil.",
  },
  {
    id: "r5",
    name: "Chicken Tikka Masala",
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80",
    dishType: "main",
    tags: ["chicken", "curry", "spicy"],
    prepTime: 20,
    cookTime: 40,
    rating: 4,
    folderId: "f1",
    createdAt: "2024-03-05",
    ingredients: [
      { amount: "700", unit: "g", name: "chicken breast" },
      { amount: "400", unit: "ml", name: "coconut cream" },
      { amount: "2", unit: "tbsp", name: "tikka masala paste" },
      { amount: "1", unit: "", name: "onion" },
    ],
    instructions:
      "Marinate chicken. Brown onions. Add paste and chicken. Simmer with cream for 20 min.",
  },
  {
    id: "r6",
    name: "French Onion Soup",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80",
    dishType: "soup",
    tags: ["french", "comfort", "winter"],
    prepTime: 10,
    cookTime: 60,
    rating: 4,
    folderId: null,
    createdAt: "2024-03-10",
    ingredients: [
      { amount: "6", unit: "", name: "large onions" },
      { amount: "1", unit: "L", name: "beef broth" },
      { amount: "200", unit: "g", name: "gruyère cheese" },
      { amount: "4", unit: "", name: "slices baguette" },
    ],
    instructions:
      "Caramelise onions 45 min. Add broth. Simmer 15 min. Top with bread and cheese, broil.",
  },
];
