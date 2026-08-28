import { describe, expect, test } from "bun:test";
import {
  CONVERSION_RETENTION_MS,
  conversionActiveAfter,
  isConversionRecordExpired,
} from "./conversion-expiration.js";

describe("conversion expiration", () => {
  const now = new Date("2026-08-24T04:00:00.000Z");

  test("uses expiresAt when present", () => {
    expect(
      isConversionRecordExpired(
        {
          createdAt: new Date("2026-08-24T00:00:00.000Z"),
          expiresAt: new Date("2026-08-24T02:00:00.000Z"),
        },
        now,
      ),
    ).toBe(true);
    expect(
      isConversionRecordExpired(
        {
          createdAt: new Date("2026-08-24T00:00:00.000Z"),
          expiresAt: new Date("2026-08-24T06:00:00.000Z"),
        },
        now,
      ),
    ).toBe(false);
  });

  test("treats missing expiresAt as createdAt plus the default retention", () => {
    expect(
      isConversionRecordExpired(
        {
          createdAt: new Date("2026-08-24T01:00:00.000Z"),
          expiresAt: null,
        },
        now,
      ),
    ).toBe(true);
    expect(
      isConversionRecordExpired(
        {
          createdAt: new Date("2026-08-24T03:00:00.000Z"),
          expiresAt: null,
        },
        now,
      ),
    ).toBe(false);
  });

  test("computes the list cutoff from retention", () => {
    expect(conversionActiveAfter(now).toISOString()).toBe(
      new Date(now.getTime() - CONVERSION_RETENTION_MS).toISOString(),
    );
  });
});
