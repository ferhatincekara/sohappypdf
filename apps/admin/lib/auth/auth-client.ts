import { createAuthClient } from "better-auth/react";
import {
  ADMIN_AUTH_SURFACE,
  ADMIN_AUTH_SURFACE_HEADER,
  getBrowserApiBaseUrl,
} from "@/config/public-env";

export const authClient = createAuthClient({
  baseURL: getBrowserApiBaseUrl(),
  fetchOptions: {
    credentials: "include",
    headers: {
      [ADMIN_AUTH_SURFACE_HEADER]: ADMIN_AUTH_SURFACE,
    },
  },
});
