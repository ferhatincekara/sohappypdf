import type { RateLimitSubject } from "@repo/rate-limit";
import { fingerprintClientIp } from "./auth/ip-fingerprint.js";
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
      userId: identity.userId,
    };
  }

  return {
    kind: "anonymous",
    sessionId: identity.sessionId ?? "unidentified",
    ipFingerprint: fingerprintClientIp(ip),
  };
}

/**
 * Infrastructure health checks stay outside rate limiting so platform
 * probes remain reliable even when anonymous traffic is being throttled.
 */
export function isHealthPath(path: string): boolean {
  return path === "/health" || path === "/api/v1/health";
}

export function isRateLimitExemptPath(path: string): boolean {
  return (
    isHealthPath(path) ||
    path === "/api/v1/billing/webhooks" ||
    path === "/api/v1/openapi.json"
  );
}

export function isAnonymousApiPath(path: string): boolean {
  return path === "/api/v1/anonymous" || path.startsWith("/api/v1/anonymous/");
}
