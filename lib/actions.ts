"use server";

import { updateTag, revalidatePath } from "next/cache";
import { auth } from "@/auth";

// Bust the 24h cache for a given username so the next page load
// re-fetches GitHub data and regenerates Claude content.
// updateTag immediately expires the cache (user sees fresh content right away).
// Only the authenticated user may refresh their own portfolio.
export async function refreshPortfolio(username: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.login || session.user.login !== username) {
    throw new Error("Unauthorized");
  }

  updateTag(username);
  revalidatePath(`/${username}`);
  revalidatePath("/dashboard");
}
