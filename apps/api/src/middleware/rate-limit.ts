import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import {
  getRetryAfterSeconds,
  type RateLimitDecision,
  type RateLimitSubject,
} from "@sohappypdf/rate-limit";
import type { Context, MiddlewareHandler } from "hono";
import type { AppEnv } from "../app-env.js";
import { getClientIp } from "../client-ip.js";
import {
  isRateLimitExemptPath,
  toRateLimitSubject,
} from "../rate-limit-subject.js";

export type CheckRateLimit = (
  subject: RateLimitSubject,
) => Promise<RateLimitDecision>;

export function applyRateLimitHeaders(
  headers: Headers,
  decision: RateLimitDecision,
  nowMs: number,
): void {
  if (decision.failedOpen) {
    return;
  }

  headers.set("RateLimit-Limit", String(decision.limit));
  headers.set("RateLimit-Remaining", String(decision.remaining));
  headers.set("RateLimit-Reset", String(Math.ceil(decision.resetAtMs / 1000)));

  if (!decision.allowed) {
    const retryAfter = getRetryAfterSeconds(decision.resetAtMs, nowMs);

    if (retryAfter !== undefined) {
      headers.set("Retry-After", String(retryAfter));
    }
  }
}

function setRateLimitHeaders(
  c: Context<AppEnv>,
  decision: RateLimitDecision,
  nowMs: number,
): void {
  const headers = new Headers();
  applyRateLimitHeaders(headers, decision, nowMs);

  for (const [name, value] of headers.entries()) {
    c.header(name, value);
  }
}

export function rateLimitMiddleware(
  checkRateLimit: CheckRateLimit,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (isRateLimitExemptPath(c.req.path)) {
      await next();
      return;
    }

    const subject = toRateLimitSubject(
      c.get("identity"),
      getClientIp(c.req.raw.headers),
    );
    const decision = await checkRateLimit(subject);

    if (decision.failedOpen) {
      c.get("logger").warn("rate limit check failed open", {
        limiter: decision.kind,
      });
    }

    setRateLimitHeaders(c, decision, Date.now());

    if (!decision.allowed) {
      throw new AppError({
        code: APP_ERROR_CODES.RATE_LIMITED,
        message: "Too many requests",
      });
    }

    await next();
  };
}
