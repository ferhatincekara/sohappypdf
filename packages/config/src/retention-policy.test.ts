import { describe, expect, test } from "bun:test";
import {
  getExpirationDate,
  loadRetentionPolicy,
  resolveRetentionMs,
} from "./retention-policy.js";

describe("retention policy", () => {
  test("loads anonymous and authenticated windows from configuration", () => {
    const policy = loadRetentionPolicy({
      FILE_RETENTION_HOURS: "3",
      ANONYMOUS_RETENTION_HOURS: "1",
    });

    expect(resolveRetentionMs(policy, "authenticated")).toBe(
      3 * 60 * 60 * 1000,
    );
    expect(resolveRetentionMs(policy, "temporary")).toBe(3 * 60 * 60 * 1000);
    expect(resolveRetentionMs(policy, "output")).toBe(3 * 60 * 60 * 1000);
    expect(resolveRetentionMs(policy, "anonymous")).toBe(1 * 60 * 60 * 1000);
  });

  test("defaults every kind to the two-hour temporary window", () => {
    const policy = loadRetentionPolicy({});
    const twoHours = 2 * 60 * 60 * 1000;

    expect(policy).toEqual({
      anonymousMs: twoHours,
      authenticatedMs: twoHours,
      outputMs: twoHours,
      temporaryMs: twoHours,
    });
  });

  test("computes expiresAt from retention without embedding literals at call sites", () => {
    const createdAt = new Date("2026-08-24T01:00:00.000Z");
    expect(
      getExpirationDate({
        createdAt,
        retentionMs: 2 * 60 * 60 * 1000,
      }).toISOString(),
    ).toBe("2026-08-24T03:00:00.000Z");
  });
});
