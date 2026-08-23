import { describe, expect, test } from "bun:test";
import {
  API_KEY_LAST_USED_UPDATE_INTERVAL_MS,
  shouldUpdateLastUsedAt,
} from "./api-key-last-used.js";

describe("shouldUpdateLastUsedAt", () => {
  test("updates when the key has never been used", () => {
    expect(
      shouldUpdateLastUsedAt(null, new Date("2026-01-01T00:00:00.000Z")),
    ).toBe(true);
  });

  test("skips writes inside the interval", () => {
    const lastUsedAt = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date(
      lastUsedAt.getTime() + API_KEY_LAST_USED_UPDATE_INTERVAL_MS - 1,
    );

    expect(shouldUpdateLastUsedAt(lastUsedAt, now)).toBe(false);
  });
});
