import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  type AnonymousSessionService,
  createAnonymousSessionCookieClearOptions,
} from "@repo/auth";
import type { ConversionService } from "@repo/conversions";
import type { FileService } from "@repo/files";
import type { MiddlewareHandler } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import { claimAnonymousSession } from "../anonymous/claim-anonymous-session.js";
import type { AppEnv } from "../app-env.js";
import { isHealthPath } from "../rate-limit-subject.js";

export type ClaimAnonymousSessionMiddlewareOptions = {
  service?: AnonymousSessionService;
  getFileService: () => FileService;
  getConversionService: () => ConversionService;
  cookieSecure: boolean;
};

export function claimAnonymousSessionMiddleware(
  options: ClaimAnonymousSessionMiddlewareOptions,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const identity = c.get("identity");

    if (
      identity.kind !== "session" ||
      options.service === undefined ||
      isHealthPath(c.req.path)
    ) {
      await next();
      return;
    }

    const rawToken = getCookie(c, ANONYMOUS_SESSION_COOKIE_NAME);

    if (rawToken === undefined || rawToken.length === 0) {
      await next();
      return;
    }

    const result = await claimAnonymousSession({
      rawToken,
      userId: identity.userId,
      anonymousSessions: options.service,
      files: options.getFileService(),
      conversions: options.getConversionService(),
    });

    if (result.cookieShouldClear) {
      deleteCookie(
        c,
        ANONYMOUS_SESSION_COOKIE_NAME,
        createAnonymousSessionCookieClearOptions(options.cookieSecure),
      );
    }

    await next();
  };
}
