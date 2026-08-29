import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import {
  type AuthSession,
  assertAuthSession,
  toSessionAuthIdentity,
} from "./auth-session.js";

const session: AuthSession = {
  user: {
    id: "user_1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    emailVerified: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    image: null,
  },
  session: {
    id: "session_1",
    userId: "user_1",
    token: "session-token",
    expiresAt: new Date("2026-01-08T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ipAddress: null,
    userAgent: null,
  },
};

describe("auth session helpers", () => {
  test("rejects a missing session without leaking details", () => {
    try {
      assertAuthSession(null);
      throw new Error("expected authentication to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("UNAUTHORIZED");
        expect(error.message).toBe("Authentication required");
      }
    }
  });

  test("returns a session identity for future API-key extension", () => {
    const identity = toSessionAuthIdentity(assertAuthSession(session));

    expect(identity).toEqual({
      kind: "session",
      userId: "user_1",
      sessionId: "session_1",
    });
  });
});
