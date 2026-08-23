import { loadApiConfig, loadAuthConfig } from "@repo/config";
import { getDb } from "@repo/db";
import { type Auth, createAuth } from "./auth.js";
import { createAuthDrizzleAdapter } from "./auth-adapter.js";

let auth: Auth | undefined;

export function getAuth(): Auth {
  if (auth === undefined) {
    auth = createAuth({
      config: loadAuthConfig(),
      database: createAuthDrizzleAdapter(getDb()),
      trustedOrigins: loadApiConfig().corsOrigins,
    });
  }

  return auth;
}
