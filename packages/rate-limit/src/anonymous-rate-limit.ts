import type { RateLimitDecision } from "./rate-limit-result.js";

export function combineAnonymousRateLimitDecisions(
  left: RateLimitDecision,
  right: RateLimitDecision,
): RateLimitDecision {
  const leftBlocks = !left.allowed && !left.failedOpen;
  const rightBlocks = !right.allowed && !right.failedOpen;

  if (leftBlocks && rightBlocks) {
    return left.remaining <= right.remaining ? left : right;
  }

  if (leftBlocks) {
    return left;
  }

  if (rightBlocks) {
    return right;
  }

  return {
    allowed: true,
    failedOpen: left.failedOpen && right.failedOpen,
    kind: left.kind,
    limit: Math.min(left.limit, right.limit),
    remaining: Math.min(left.remaining, right.remaining),
    resetAtMs: Math.max(left.resetAtMs, right.resetAtMs),
  };
}
