import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import {
  assertUserNotSuspended,
  hasAdminRole,
  isUserRole,
} from "./admin-authorization.js";

describe("admin authorization", () => {
  test("accepts stored admin roles and bootstrap user IDs", () => {
    expect(isUserRole("admin")).toBe(true);
    expect(isUserRole("support")).toBe(false);
    expect(hasAdminRole("admin", "user_1")).toBe(true);
    expect(hasAdminRole("user", "user_1")).toBe(false);
    expect(hasAdminRole("user", "user_1", ["user_1"])).toBe(true);
  });

  test("rejects suspended accounts", () => {
    try {
      assertUserNotSuspended({
        userId: "user_1",
        email: "user@example.com",
        name: "User",
        role: "admin",
        suspendedAt: new Date("2026-01-01T00:00:00.000Z"),
        suspendedReason: "abuse",
      });
      throw new Error("expected suspension to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("FORBIDDEN");
        expect(error.message).toBe("Account is suspended");
      }
    }
  });
});
