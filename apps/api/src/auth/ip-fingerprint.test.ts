import { describe, expect, test } from "bun:test";
import { fingerprintClientIp } from "./ip-fingerprint.js";

describe("fingerprintClientIp", () => {
  test("hashes an IP into a stable fingerprint without returning the raw address", () => {
    const fingerprint = fingerprintClientIp("203.0.113.10");

    expect(fingerprint).toHaveLength(16);
    expect(fingerprint).toBe(fingerprintClientIp("203.0.113.10"));
    expect(fingerprint.includes("203")).toBe(false);
    expect(fingerprint).not.toBe(fingerprintClientIp("198.51.100.20"));
  });
});
