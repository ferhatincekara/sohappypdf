import { describe, expect, test } from "bun:test";
import { APP_ERROR_CODES, isAppError } from "@sohappypdf/core";
import { verifyPolarWebhook } from "./polar-webhook.js";

describe("verifyPolarWebhook", () => {
  test("rejects an invalid signature", () => {
    try {
      verifyPolarWebhook(
        JSON.stringify({ type: "subscription.updated", data: {} }),
        {
          "webhook-id": "evt_1",
          "webhook-timestamp": "1",
          "webhook-signature": "v1,invalid",
        },
        "whsec_test",
      );
      throw new Error("expected verification to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.FORBIDDEN);
      }
    }
  });
});
