import { describe, expect, test } from "bun:test";
import { firstFormErrorMessage } from "./first-form-error-message";

describe("firstFormErrorMessage", () => {
  test("returns the first field message", () => {
    expect(
      firstFormErrorMessage({
        email: { type: "required", message: "Enter a valid email address." },
        password: {
          type: "min",
          message: "Password must be at least 8 characters.",
        },
      }),
    ).toBe("Enter a valid email address.");
  });

  test("returns undefined when there are no messages", () => {
    expect(firstFormErrorMessage({})).toBeUndefined();
  });
});
