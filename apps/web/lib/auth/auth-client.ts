import { createAuthClient } from "better-auth/react";
import { getBrowserApiBaseUrl } from "@/config/public-env";

export function createWebAuthClient() {
  return createAuthClient({
    baseURL: getBrowserApiBaseUrl(),
    fetchOptions: {
      credentials: "include",
    },
  });
}

export const authClient = createWebAuthClient();
