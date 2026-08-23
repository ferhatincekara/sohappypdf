import type { RateLimitSubject } from "@repo/rate-limit";
import type { RequestIdentity } from "./auth/request-identity.js";

export function toRateLimitSubject(
  identity: RequestIdentity,
  ip: string,
): RateLimitSubject {
  if (identity.kind === "session") {
    return {
      kind: "user",
      userId: identity.userId,
    };
  }

  if (identity.kind === "api-key") {
    return {
      kind: "api-client",
      apiClientId: identity.apiKeyId,
    };
  }

  return {
    kind: "anonymous",
    ip,
  };
}

/**
 * Infrastructure health checks stay outside rate limiting so platform
 * probes remain reliable even when anonymous traffic is being throttled.
 */
export function isHealthPath(path: string): boolean {
  return path === "/health" || path === "/api/v1/health";
}
