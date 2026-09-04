import { describe, expect, test } from "bun:test";
import { mapAdminSignInError } from "./login-errors";

describe("mapAdminSignInError", () => {
  test("shows a dedicated warning for a suspended account", () => {
    expect(mapAdminSignInError({ code: "ACCOUNT_SUSPENDED" })).toBe(
      "This account is suspended and cannot sign in.",
    );
    expect(mapAdminSignInError({ message: "Account is suspended" })).toBe(
      "This account is suspended and cannot sign in.",
    );
  });

  test("keeps other failures generic", () => {
    expect(mapAdminSignInError({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      "Unable to sign in with those credentials.",
    );
    expect(mapAdminSignInError(null)).toBe(
      "Unable to sign in with those credentials.",
    );
  });
});
