import { cookies } from "next/headers";
import { cache } from "react";
import { cookieHeaderFromStore } from "@/features/auth/session/session-request-headers";
import { serverAuthClient } from "@/lib/auth/server-auth-client";

export type WebSession = NonNullable<typeof serverAuthClient.$Infer.Session>;

const SESSION_FETCH_ATTEMPTS = 2;

export const getWebSession = cache(async (): Promise<WebSession | null> => {
  const cookie = cookieHeaderFromStore((await cookies()).getAll());

  if (cookie === undefined) {
    return null;
  }

  for (let attempt = 0; attempt < SESSION_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const result = await serverAuthClient.getSession({
        fetchOptions: {
          headers: { cookie },
          cache: "no-store",
        },
      });

      return result.data ?? null;
    } catch {
      if (attempt === SESSION_FETCH_ATTEMPTS - 1) {
        return null;
      }
    }
  }

  return null;
});
