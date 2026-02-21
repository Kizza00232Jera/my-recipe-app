import { currentUser } from "@clerk/nextjs/server";
import { HomeClient } from "@/components/home-client";
import { getFolders, getOrCreateUser, getRecipes } from "@/lib/db/queries";

export default async function Home() {
  const clerkUser = await currentUser();
  const dbUser = await getOrCreateUser(
    clerkUser!.id,
    clerkUser!.emailAddresses[0]?.emailAddress ?? ""
  );

  const [recipes, folders] = await Promise.all([
    getRecipes(dbUser.id),
    getFolders(dbUser.id),
  ]);

  return <HomeClient recipes={recipes} folders={folders} />;
}
