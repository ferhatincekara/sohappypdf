import { describe, expect, test } from "bun:test";
import { combineAnonymousRateLimitDecisions } from "./anonymous-rate-limit.js";
import type { RateLimitDecision } from "./rate-limit-result.js";

function decision(
  overrides: Partial<RateLimitDecision> = {},
): RateLimitDecision {
  return {
    allowed: true,
    failedOpen: false,
    kind: "anonymous",
    limit: 30,
    remaining: 10,
    resetAtMs: 1_000,
    ...overrides,
  };
}

describe("combineAnonymousRateLimitDecisions", () => {
  test("denies when either session or IP limiter rejects", () => {
    const denied = combineAnonymousRateLimitDecisions(
      decision({ allowed: true, remaining: 9 }),
      decision({ allowed: false, remaining: 0, resetAtMs: 2_000 }),
    );

    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
  });

  test("allows when a check fails open and the other succeeds", () => {
    const allowed = combineAnonymousRateLimitDecisions(
      decision({ allowed: true, failedOpen: true, remaining: 30 }),
      decision({ allowed: true, remaining: 8 }),
    );

    expect(allowed.allowed).toBe(true);
    expect(allowed.failedOpen).toBe(false);
    expect(allowed.remaining).toBe(8);
  });
});
