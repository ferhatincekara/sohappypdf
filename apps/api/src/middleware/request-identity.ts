import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../app-env.js";
import type { ResolveRequestIdentity } from "../auth/request-identity.js";

export function requestIdentityMiddleware(
  resolveIdentity: ResolveRequestIdentity,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    c.set("identity", await resolveIdentity(c.req.raw.headers));
    await next();
  };
}
