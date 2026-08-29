import type { RateLimitSubject } from "@repo/rate-limit";
import { fingerprintClientIp } from "./auth/ip-fingerprint.js";
import type { RequestIdentity } from "./auth/request-identity.js";
import {
  PUBLIC_API_PREFIX,
  PUBLIC_V1_PATHS,
} from "./public-contract/public-v1-paths.js";

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
  return path === "/health" || path === PUBLIC_V1_PATHS.health;
}

export function isRateLimitExemptPath(path: string): boolean {
  return (
    isHealthPath(path) ||
    path === `${PUBLIC_API_PREFIX}/billing/webhooks` ||
    path === PUBLIC_V1_PATHS.openapi
  );
}

export function isAnonymousApiPath(path: string): boolean {
  return (
    path === `${PUBLIC_API_PREFIX}/anonymous` ||
    path.startsWith(`${PUBLIC_API_PREFIX}/anonymous/`)
  );
}
