import { randomUUID } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../app-env.js";

export const REQUEST_ID_HEADER = "X-Request-Id";

const TRUSTED_REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,128}$/;

export function resolveRequestId(candidate: string | undefined): string {
  if (candidate !== undefined && TRUSTED_REQUEST_ID_PATTERN.test(candidate)) {
    return candidate;
  }

  return randomUUID();
}

export function requestIdMiddleware(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const requestId = resolveRequestId(c.req.header("x-request-id"));
    c.set("requestId", requestId);
    c.header(REQUEST_ID_HEADER, requestId);
    await next();
  };
}
