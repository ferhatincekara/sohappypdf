import { describe, expect, test } from "bun:test";
import { APP_ERROR_CODES, isAppError } from "@repo/core";
import { requireAdminActor } from "../middleware/require-admin.js";

describe("requireAdminActor", () => {
  test("rejects missing actors and non-allowlisted sessions", () => {
    try {
      requireAdminActor(null, { userIds: ["admin_1"], emails: [] });
      throw new Error("expected rejection");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.FORBIDDEN);
      }
    }

    try {
      requireAdminActor(
        { userId: "user_1", email: "user@example.com", name: "User" },
        { userIds: ["admin_1"], emails: [] },
      );
      throw new Error("expected rejection");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });

  test("accepts allowlisted operators", () => {
    const actor = requireAdminActor(
      { userId: "admin_1", email: "ops@example.com", name: "Ops" },
      { userIds: ["admin_1"], emails: [] },
    );

    expect(actor.userId).toBe("admin_1");
  });
});
