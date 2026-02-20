import { currentUser } from "@clerk/nextjs/server";
import { HomeClient } from "@/components/home-client";
import { getFolders, getOrCreateUser, getRecipes } from "@/lib/db/queries";
import { DEMO_RECIPES, DEMO_FOLDERS } from "@/lib/demo-data";

export default async function Home() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return <HomeClient recipes={DEMO_RECIPES} folders={DEMO_FOLDERS} isDemo />;
  }

  const dbUser = await getOrCreateUser(
    clerkUser.id,
    clerkUser.emailAddresses[0]?.emailAddress ?? ""
  );

  const [recipes, folders] = await Promise.all([
    getRecipes(dbUser.id),
    getFolders(dbUser.id),
  ]);

  return <HomeClient recipes={recipes} folders={folders} />;
}
