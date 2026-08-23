import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import {
  DEFAULT_RATE_LIMIT_CONFIG,
  loadRateLimitConfig,
} from "./rate-limit-config.js";

describe("loadRateLimitConfig", () => {
  test("uses infrastructure defaults when limits are omitted", () => {
    const config = loadRateLimitConfig({});

    expect(config.redis).toBeUndefined();
    expect(config.anonymousPerMinute).toBe(
      DEFAULT_RATE_LIMIT_CONFIG.anonymousPerMinute,
    );
    expect(config.authenticatedPerMinute).toBe(
      DEFAULT_RATE_LIMIT_CONFIG.authenticatedPerMinute,
    );
    expect(config.apiPerMinute).toBe(DEFAULT_RATE_LIMIT_CONFIG.apiPerMinute);
  });

  test("requires both Redis REST values when one is present", () => {
    try {
      loadRateLimitConfig({
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
