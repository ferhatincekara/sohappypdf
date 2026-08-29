import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import {
  buildResetPasswordEmail,
  createResetPasswordEmailSender,
} from "./reset-password-email.js";

const RESET_URL =
  "http://localhost:3000/reset-password?token=reset-token-value";

describe("buildResetPasswordEmail", () => {
  test("includes the reset link without a standalone token field", () => {
    const message = buildResetPasswordEmail(RESET_URL);

    expect(message.subject).toBe("Reset your SoHappyPDF password");
    expect(message.subject.includes("reset-token-value")).toBe(false);
    expect(message.text.includes(RESET_URL)).toBe(true);
    expect(message.html.includes("Reset password")).toBe(true);
    expect(message.html.includes("SoHappyPDF")).toBe(true);
    expect(message.html.includes('href="http://localhost:3000"')).toBe(true);
    expect(
      message.html.includes(
        'href="http://localhost:3000/reset-password?token=reset-token-value"',
      ),
    ).toBe(true);
  });

  test("rejects a non-http reset URL", () => {
    try {
      buildResetPasswordEmail("javascript:alert(1)");
      throw new Error("expected the reset URL to be rejected");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});

describe("createResetPasswordEmailSender", () => {
  test("does nothing when Resend is not configured", async () => {
    const warnings: string[] = [];

    await createResetPasswordEmailSender({
      logger: {
        level: "warn",
        error() {},
        warn(message) {
          warnings.push(message);
        },
        info() {},
        debug() {},
        child() {
          throw new Error("unused");
        },
      },
    })({
      user: { email: "ada@example.com" },
      url: RESET_URL,
      token: "reset-token-value",
    });

    expect(warnings).toEqual([
      "Password reset email was not sent because Resend is not configured",
    ]);
  });

  test("sends the reset message and does not pass the raw token to Resend", async () => {
    const sent: Array<{
      to: string;
      subject: string;
      text: string;
      html: string;
    }> = [];

    await createResetPasswordEmailSender({
      sendEmail: async (input) => {
        sent.push(input);
      },
    })({
      user: { email: "ada@example.com" },
      url: RESET_URL,
      token: "reset-token-value",
    });

    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe("ada@example.com");
    expect(sent[0]?.subject.includes("reset-token-value")).toBe(false);
    expect(sent[0]?.text.includes(RESET_URL)).toBe(true);
    expect(JSON.stringify(sent).includes('"token":"reset-token-value"')).toBe(
      false,
    );
  });

  test("does not throw when delivery fails so account existence stays hidden", async () => {
    const errors: string[] = [];

    await createResetPasswordEmailSender({
      sendEmail: async () => {
        throw new Error("resend unavailable");
      },
      logger: {
        level: "error",
        error(message) {
          errors.push(message);
        },
        warn() {},
        info() {},
        debug() {},
        child() {
          throw new Error("unused");
        },
      },
    })({
      user: { email: "ada@example.com" },
      url: RESET_URL,
      token: "reset-token-value",
    });

    expect(errors).toEqual(["Failed to send password reset email"]);
  });
});
