import type { RateLimitConfig } from "@sohappypdf/config";
import type { RateLimitKind } from "./rate-limit-identity.js";

export const RATE_LIMIT_WINDOW = "1 m" as const;

export type RateLimitPolicy = {
  kind: RateLimitKind;
  limit: number;
  window: typeof RATE_LIMIT_WINDOW;
};

export type RateLimitPolicies = {
  anonymous: RateLimitPolicy;
  authenticated: RateLimitPolicy;
  api: RateLimitPolicy;
};

export function createRateLimitPolicies(
  config: Pick<
    RateLimitConfig,
    "anonymousPerMinute" | "authenticatedPerMinute" | "apiPerMinute"
  >,
): RateLimitPolicies {
  return {
    anonymous: {
      kind: "anonymous",
      limit: config.anonymousPerMinute,
      window: RATE_LIMIT_WINDOW,
    },
    authenticated: {
      kind: "authenticated",
      limit: config.authenticatedPerMinute,
      window: RATE_LIMIT_WINDOW,
    },
    api: {
      kind: "api",
      limit: config.apiPerMinute,
      window: RATE_LIMIT_WINDOW,
    },
  };
}
