import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { DEFAULT_RESEND_FROM_EMAIL, loadEmailConfig } from "./email-config.js";

describe("loadEmailConfig", () => {
  test("allows Resend to be omitted so local and CI can run without email", () => {
    const config = loadEmailConfig({});

    expect(config.resendApiKey).toBeUndefined();
    expect(config.fromEmail).toBe(DEFAULT_RESEND_FROM_EMAIL);
  });

  test("reads Resend credentials from environment configuration", () => {
    const config = loadEmailConfig({
      RESEND_API_KEY: "re_test",
      RESEND_FROM_EMAIL: "SoHappyPDF <beth.t@example.com>",
    });

    expect(config.resendApiKey).toBe("re_test");
    expect(config.fromEmail).toBe("SoHappyPDF <beth.t@example.com>");
  });

  test("rejects a from address without an email", () => {
    try {
      loadEmailConfig({
        RESEND_FROM_EMAIL: "SoHappyPDF",
      });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFIGURATION_ERROR");
      }
    }
  });
});
