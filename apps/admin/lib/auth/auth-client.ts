import { createAuthClient } from "better-auth/react";
import { getBrowserApiBaseUrl } from "@/config/public-env";

export const authClient = createAuthClient({
  baseURL: getBrowserApiBaseUrl(),
  fetchOptions: {
    credentials: "include",
  },
});
