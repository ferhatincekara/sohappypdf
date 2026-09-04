import { cookies } from "next/headers";
import { cache } from "react";
import {
  ADMIN_AUTH_SURFACE,
  ADMIN_AUTH_SURFACE_HEADER,
} from "@/config/public-env";
import { serverAuthClient } from "@/lib/auth/server-auth-client";

export type AdminSession = NonNullable<typeof serverAuthClient.$Infer.Session>;

function cookieHeaderFromStore(
  store: ReadonlyArray<{ name: string; value: string }>,
): string | undefined {
  if (store.length === 0) {
    return undefined;
  }

  return store.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const cookie = cookieHeaderFromStore((await cookies()).getAll());

  if (cookie === undefined) {
    return null;
  }

  try {
    const result = await serverAuthClient.getSession({
      fetchOptions: {
        headers: {
          cookie,
          [ADMIN_AUTH_SURFACE_HEADER]: ADMIN_AUTH_SURFACE,
        },
        cache: "no-store",
      },
    });

    return result.data ?? null;
  } catch {
    return null;
  }
});
