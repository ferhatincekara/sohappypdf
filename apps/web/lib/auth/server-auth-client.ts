import { createAuthClient } from "better-auth/react";
import { getServerApiBaseUrl } from "@/config/public-env";

export function createServerAuthClient() {
  return createAuthClient({
    baseURL: getServerApiBaseUrl(),
    fetchOptions: {
      credentials: "include",
    },
  });
}

export const serverAuthClient = createServerAuthClient();
