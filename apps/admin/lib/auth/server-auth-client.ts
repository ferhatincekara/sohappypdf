import { createAuthClient } from "better-auth/react";
import { getServerApiBaseUrl } from "@/config/public-env";

export const serverAuthClient = createAuthClient({
  baseURL: getServerApiBaseUrl(),
  fetchOptions: {
    credentials: "include",
  },
});
