import { describe, expect, test } from "bun:test";
import { hasWebSession } from "@/features/auth/session/session-state";

describe("session access", () => {
  test("treats a missing session as unauthenticated", () => {
    expect(hasWebSession(null)).toBe(false);
  });

  test("treats a Better Auth session payload as authenticated", () => {
    const session = {
      user: {
        id: "user_1",
        email: "ada@example.com",
        name: "ada",
      },
      session: {
        id: "session_1",
        userId: "user_1",
      },
    };

    expect(hasWebSession(session)).toBe(true);
  });
});
