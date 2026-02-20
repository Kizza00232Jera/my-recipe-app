import { currentUser } from "@clerk/nextjs/server";
import { getFolders, getOrCreateUser, getRecipes } from "@/lib/db/queries";
import { FoldersClient } from "@/components/folders-client";

export default async function FoldersPage() {
  const clerkUser = await currentUser();
  const dbUser = await getOrCreateUser(
    clerkUser!.id,
    clerkUser!.emailAddresses[0]?.emailAddress ?? ""
  );

  const [recipes, folders] = await Promise.all([
    getRecipes(dbUser.id),
    getFolders(dbUser.id),
  ]);

  return <FoldersClient recipes={recipes} folders={folders} />;
}
