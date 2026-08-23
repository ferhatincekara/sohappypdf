import { createAuthClient } from "better-auth/react";
import { getPublicWebEnv } from "../../config/public-env";

export function createWebAuthClient() {
  return createAuthClient({
    baseURL: getPublicWebEnv().apiBaseUrl,
  });
}

export const authClient = createWebAuthClient();
