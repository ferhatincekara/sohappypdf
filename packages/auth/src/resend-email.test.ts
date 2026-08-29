import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { createResendEmailSender } from "./resend-email.js";

describe("createResendEmailSender", () => {
  test("sends through Resend without returning delivery internals", async () => {
    const requests: unknown[] = [];

    const send = createResendEmailSender({
      apiKey: "re_test",
      fromEmail: "SoHappyPDF <noreply@sohappypdf.com>",
      client: {
        emails: {
          send: async (input) => {
            requests.push(input);
            return { error: null };
          },
        },
      },
    });

    await send({
      to: "ada@example.com",
      subject: "Reset your SoHappyPDF password",
      text: "Reset your password",
      html: "<p>Reset your password</p>",
    });

    expect(requests).toEqual([
      {
        from: "SoHappyPDF <noreply@sohappypdf.com>",
        to: "ada@example.com",
        subject: "Reset your SoHappyPDF password",
        text: "Reset your password",
        html: "<p>Reset your password</p>",
      },
    ]);
  });

  test("maps a Resend failure to an application error", async () => {
    const send = createResendEmailSender({
      apiKey: "re_test",
      fromEmail: "SoHappyPDF <noreply@sohappypdf.com>",
      client: {
        emails: {
          send: async () => ({
            error: { message: "invalid from address" },
          }),
        },
      },
    });

    try {
      await send({
        to: "ada@example.com",
        subject: "Reset your SoHappyPDF password",
        text: "Reset your password",
        html: "<p>Reset your password</p>",
      });
      throw new Error("expected email delivery to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.message).toBe("Failed to send email");
      }
    }
  });
});
