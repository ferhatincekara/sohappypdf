import { describe, expect, test } from "bun:test";
import {
  DEFAULT_ANONYMOUS_MAX_FILES_PER_OPERATION,
  DEFAULT_ANONYMOUS_OPERATIONS_PER_DAY,
  DEFAULT_ANONYMOUS_RETENTION_HOURS,
  DEFAULT_API_GROWTH_CREDITS,
  DEFAULT_API_SCALE_CREDITS,
  DEFAULT_API_STARTER_CREDITS,
} from "@repo/config";
import {
  ANONYMOUS_WEB_LIMITS,
  DEFAULT_API_CREDIT_PACKS,
  DEFAULT_PLAN_LIMITS,
  resolveWebMaxFileSizeBytes,
} from "./default-plan-limits.js";

describe("web entitlements", () => {
  test("keeps anonymous file size at or below Free", () => {
    expect(ANONYMOUS_WEB_LIMITS.maxFileSizeBytes).toBe(
      DEFAULT_PLAN_LIMITS.free.maxFileSizeBytes,
    );
    expect(ANONYMOUS_WEB_LIMITS.maxFileSizeBytes).toBeLessThan(
      DEFAULT_PLAN_LIMITS.pro.maxFileSizeBytes,
    );
  });

  test("keeps anonymous operation defaults aligned with server config", () => {
    expect(ANONYMOUS_WEB_LIMITS.maxFilesPerOperation).toBe(
      DEFAULT_ANONYMOUS_MAX_FILES_PER_OPERATION,
    );
    expect(ANONYMOUS_WEB_LIMITS.operationsPerDay).toBe(
      DEFAULT_ANONYMOUS_OPERATIONS_PER_DAY,
    );
    expect(ANONYMOUS_WEB_LIMITS.retentionHours).toBe(
      DEFAULT_ANONYMOUS_RETENTION_HOURS,
    );
  });

  test("uses plan file size for authenticated users and Free as the fallback", () => {
    expect(
      resolveWebMaxFileSizeBytes({
        isAuthenticated: false,
        planMaxFileSizeBytes: DEFAULT_PLAN_LIMITS.pro.maxFileSizeBytes,
      }),
    ).toBe(ANONYMOUS_WEB_LIMITS.maxFileSizeBytes);
    expect(
      resolveWebMaxFileSizeBytes({
        isAuthenticated: true,
        planMaxFileSizeBytes: DEFAULT_PLAN_LIMITS.pro.maxFileSizeBytes,
      }),
    ).toBe(DEFAULT_PLAN_LIMITS.pro.maxFileSizeBytes);
    expect(
      resolveWebMaxFileSizeBytes({
        isAuthenticated: true,
        planMaxFileSizeBytes: null,
      }),
    ).toBe(DEFAULT_PLAN_LIMITS.free.maxFileSizeBytes);
  });

  test("keeps public API credit packs aligned with Polar pack defaults", () => {
    expect(DEFAULT_API_CREDIT_PACKS.starter).toBe(DEFAULT_API_STARTER_CREDITS);
    expect(DEFAULT_API_CREDIT_PACKS.growth).toBe(DEFAULT_API_GROWTH_CREDITS);
    expect(DEFAULT_API_CREDIT_PACKS.scale).toBe(DEFAULT_API_SCALE_CREDITS);
  });
});
