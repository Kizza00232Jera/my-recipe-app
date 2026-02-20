"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { getOrCreateUser } from "@/lib/db/queries";

export async function createFolder(name: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const dbUser = await getOrCreateUser(
      clerkUser.id,
      clerkUser.emailAddresses[0]?.emailAddress ?? ""
    );

    await db.insert(folders).values({
      id: createId(),
      userId: dbUser.id,
      name: name.trim(),
    });

    revalidatePath("/");
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}
