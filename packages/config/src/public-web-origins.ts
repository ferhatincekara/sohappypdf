import { loadApiConfig } from "./api-config.js";
import { loadAuthConfig } from "./auth-config.js";
import type { EnvSource } from "./env.js";
import { expandHttpsSiteOrigins } from "./site-origins.js";

export function resolvePublicWebOrigins(
  source: EnvSource = process.env,
): string[] {
  const corsOrigins = loadApiConfig(source).corsOrigins;
  const extra: string[] = [];

  try {
    const auth = loadAuthConfig(source);

    if (auth.appUrl !== undefined) {
      extra.push(auth.appUrl);
    }

    if (auth.cookieDomain !== undefined && auth.useSecureCookies) {
      extra.push(`https://${auth.cookieDomain}`);
    }
  } catch {
    // Worker and isolated tests may not have Better Auth env.
  }

  return expandHttpsSiteOrigins([...corsOrigins, ...extra]);
}
