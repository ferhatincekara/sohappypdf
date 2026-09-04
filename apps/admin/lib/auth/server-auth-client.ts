import { createAuthClient } from "better-auth/react";
import {
  ADMIN_AUTH_SURFACE,
  ADMIN_AUTH_SURFACE_HEADER,
  getServerApiBaseUrl,
} from "@/config/public-env";

export const serverAuthClient = createAuthClient({
  baseURL: getServerApiBaseUrl(),
  fetchOptions: {
    credentials: "include",
    headers: {
      [ADMIN_AUTH_SURFACE_HEADER]: ADMIN_AUTH_SURFACE,
    },
  },
});
