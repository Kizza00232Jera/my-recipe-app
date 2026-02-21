import { HomeClient } from "@/components/home-client";
import { getDemoUser, getRecipes, getFolders } from "@/lib/db/queries";
import { DEMO_RECIPES, DEMO_FOLDERS } from "@/lib/demo-data";

export default async function DemoPage() {
  const clerkId = process.env.DEMO_CLERK_ID;

  if (clerkId) {
    const owner = await getDemoUser(clerkId);
    if (owner) {
      const [recipes, folders] = await Promise.all([
        getRecipes(owner.id),
        getFolders(owner.id),
      ]);
      return (
        <HomeClient
          recipes={recipes}
          folders={folders}
          isDemo
          linkPrefix="/demo/recipe"
        />
      );
    }
  }

  // Fallback: static mock data (env var not set or owner not found)
  return (
    <HomeClient
      recipes={DEMO_RECIPES}
      folders={DEMO_FOLDERS}
      isDemo
      linkPrefix="/demo/recipe"
    />
  );
}
