import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { writeAdminAuditEvent } from "./admin-audit.js";

describe("writeAdminAuditEvent", () => {
  test("rejects empty actor or action values", async () => {
    try {
      await writeAdminAuditEvent({
        actorUserId: "  ",
        action: "user.suspended",
        targetType: "user",
        targetId: "user_1",
      });
      throw new Error("expected audit write to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    }
  });
});
