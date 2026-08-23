import { describe, expect, test } from "bun:test";
import { getClientIp } from "./client-ip.js";

describe("getClientIp", () => {
  test("prefers the Vercel-calculated x-real-ip header", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.1, 203.0.113.10",
    });

    expect(getClientIp(headers)).toBe("203.0.113.10");
  });

  test("uses x-vercel-forwarded-for when x-real-ip is absent", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "203.0.113.20",
      "x-forwarded-for": "198.51.100.1, 203.0.113.20",
    });

    expect(getClientIp(headers)).toBe("203.0.113.20");
  });

  test("ignores untrusted header values", () => {
    const headers = new Headers({
      "x-real-ip": "not-an-ip",
      "x-forwarded-for": "not-an-ip, 203.0.113.10",
    });

    expect(getClientIp(headers)).toBe("unknown");
  });

  test("falls back to unknown when no IP header is present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
