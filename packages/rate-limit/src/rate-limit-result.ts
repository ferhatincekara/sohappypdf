import type { RateLimitKind } from "./rate-limit-identity.js";

export type RateLimitDecision = {
  allowed: boolean;
  failedOpen: boolean;
  kind: RateLimitKind;
  limit: number;
  remaining: number;
  resetAtMs: number;
};

export function getRetryAfterSeconds(
  resetAtMs: number,
  nowMs: number,
): number | undefined {
  if (!Number.isFinite(resetAtMs) || resetAtMs <= 0) {
    return undefined;
  }

  return Math.max(0, Math.ceil((resetAtMs - nowMs) / 1000));
}
