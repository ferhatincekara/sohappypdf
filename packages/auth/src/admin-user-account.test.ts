import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { setUserSuspended } from "./admin-user-account.js";

describe("setUserSuspended", () => {
  test("requires a reason and blocks self-suspension", async () => {
    try {
      await setUserSuspended({
        userId: "admin_1",
        actorUserId: "admin_1",
        reason: "policy violation",
      });
      throw new Error("expected self-suspension to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    }

    try {
      await setUserSuspended({
        userId: "user_1",
        actorUserId: "admin_1",
        reason: "short",
      });
      throw new Error("expected short reason to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    }
  });
});
