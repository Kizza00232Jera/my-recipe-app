import { auth, currentUser } from "@clerk/nextjs/server";
import { HomeClient } from "@/components/home-client";
import { getFolders, getOrCreateUser, getRecipes, getUserByClerkId } from "@/lib/db/queries";

export default async function Home() {
  const { userId } = await auth();
  // Route is protected by clerkMiddleware, so userId is present here.
  // Fast path: look the user up directly (no Clerk API call). Only hit
  // currentUser() on the very first login when the row doesn't exist yet.
  let dbUser = userId ? await getUserByClerkId(userId) : null;
  if (!dbUser) {
    const clerkUser = await currentUser();
    dbUser = await getOrCreateUser(
      clerkUser!.id,
      clerkUser!.emailAddresses[0]?.emailAddress ?? ""
    );
  }

  const [recipes, folders] = await Promise.all([
    getRecipes(dbUser.id),
    getFolders(dbUser.id),
  ]);

  return <HomeClient recipes={recipes} folders={folders} />;
}
