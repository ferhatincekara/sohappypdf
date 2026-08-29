import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  type AnonymousSessionService,
  createAnonymousSessionCookieOptions,
} from "@sohappypdf/auth";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import type { MiddlewareHandler } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { AppEnv } from "../app-env.js";
import { isAnonymousApiPath } from "../rate-limit-subject.js";

export type AnonymousSessionMiddlewareOptions = {
  service?: AnonymousSessionService;
  cookieSecure: boolean;
  cookieMaxAgeSeconds: number;
};

export function anonymousSessionMiddleware(
  options: AnonymousSessionMiddlewareOptions,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const identity = c.get("identity");
    const path = c.req.path;

    if (identity.kind === "session" || identity.kind === "api-key") {
      if (isAnonymousApiPath(path)) {
        throw new AppError({
          code: APP_ERROR_CODES.FORBIDDEN,
          message: "Anonymous access only",
        });
      }

      await next();
      return;
    }

    const rawToken = getCookie(c, ANONYMOUS_SESSION_COOKIE_NAME);
    const needsSession = isAnonymousApiPath(path) || rawToken !== undefined;

    if (!needsSession || options.service === undefined) {
      await next();
      return;
    }

    const resolved = await options.service.resolveFromToken(rawToken);

    c.set("identity", {
      kind: "anonymous",
      sessionId: resolved.session.id,
    });

    if (resolved.cookieShouldSet) {
      setCookie(
        c,
        ANONYMOUS_SESSION_COOKIE_NAME,
        resolved.rawToken,
        createAnonymousSessionCookieOptions({
          secure: options.cookieSecure,
          maxAgeSeconds: options.cookieMaxAgeSeconds,
        }),
      );
    }

    await next();
  };
}
