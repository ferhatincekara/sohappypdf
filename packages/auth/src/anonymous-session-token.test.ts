import { describe, expect, test } from "bun:test";
import {
  ANONYMOUS_SESSION_TOKEN_PREFIX,
  generateAnonymousSessionToken,
  hashAnonymousSessionToken,
  isAnonymousSessionTokenFormat,
} from "./anonymous-session-token.js";

describe("anonymous session token", () => {
  test("generates an unpredictable opaque token and stores only the hash", () => {
    const first = generateAnonymousSessionToken();
    const second = generateAnonymousSessionToken();

    expect(first.rawToken.startsWith(ANONYMOUS_SESSION_TOKEN_PREFIX)).toBe(
      true,
    );
    expect(first.rawToken).not.toBe(second.rawToken);
    expect(first.tokenHash).not.toBe(second.tokenHash);
    expect(first.tokenHash).toBe(hashAnonymousSessionToken(first.rawToken));
    expect(first.tokenHash.includes(first.rawToken)).toBe(false);
    expect(isAnonymousSessionTokenFormat(first.rawToken)).toBe(true);
    expect(isAnonymousSessionTokenFormat("user@example.com")).toBe(false);
    expect(isAnonymousSessionTokenFormat("anon_predictable")).toBe(false);
  });
});
