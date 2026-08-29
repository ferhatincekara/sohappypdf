import { cookies } from "next/headers";
import { cache } from "react";
import { getServerApiV1BaseUrl } from "@/config/public-env";
import { cookieHeaderFromStore } from "@/features/auth/session/session-request-headers";
import { parseWebToolBilling, type WebToolBilling } from "./web-tool-billing";

export type { WebToolBilling };

export const getWebToolBilling = cache(
  async (): Promise<WebToolBilling | null> => {
    const cookie = cookieHeaderFromStore((await cookies()).getAll());

    if (cookie === undefined) {
      return null;
    }

    try {
      const response = await fetch(`${getServerApiV1BaseUrl()}/billing`, {
        headers: {
          cookie,
          accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return null;
      }

      return parseWebToolBilling(await response.json());
    } catch {
      return null;
    }
  },
);
