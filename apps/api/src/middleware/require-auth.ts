import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../app-env.js";
import { requireAuthenticatedIdentity } from "../auth/request-identity.js";

export function requireAuthMiddleware(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    requireAuthenticatedIdentity(c.get("identity"));
    await next();
  };
}
