import { adminCookieHeader } from "@sohappypdf/auth";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  ADMIN_AUTH_SURFACE,
  ADMIN_AUTH_SURFACE_HEADER,
} from "@/config/public-env";
import { serverAuthClient } from "@/lib/auth/server-auth-client";

export type AdminSession = NonNullable<typeof serverAuthClient.$Infer.Session>;

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const cookie = adminCookieHeader((await cookies()).getAll());

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
