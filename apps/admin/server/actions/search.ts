"use server";

import { requireAdminAction } from "@/server/auth/require-admin";
import { searchAdmin } from "@/server/query/search";

export async function searchAdminAction(query: string) {
  await requireAdminAction({ rateLimit: false });
  return searchAdmin(query);
}
