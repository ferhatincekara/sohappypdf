import { headers } from "next/headers";
import { cache } from "react";
import { authClient } from "@/lib/auth/auth-client";

export type WebSession = NonNullable<typeof authClient.$Infer.Session>;

export const getWebSession = cache(async (): Promise<WebSession | null> => {
  const result = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  return result.data ?? null;
});
