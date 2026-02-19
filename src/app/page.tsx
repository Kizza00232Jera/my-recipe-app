import { HomeClient } from "@/components/home-client";
import { getFolders, getRecipes } from "@/lib/db/queries";

export default async function Home() {
  const [recipes, folders] = await Promise.all([getRecipes(), getFolders()]);

  return <HomeClient recipes={recipes} folders={folders} />;
}
