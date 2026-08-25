import { createAuthClient } from "better-auth/react";
import { getPublicAdminEnv } from "../config/public-env";

export const authClient = createAuthClient({
  baseURL: getPublicAdminEnv().apiBaseUrl,
  fetchOptions: {
    credentials: "include",
  },
});
