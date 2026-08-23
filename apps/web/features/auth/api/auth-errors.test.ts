import { describe, expect, test } from "bun:test";
import {
  AUTH_ERROR_KEYS,
  mapAuthError,
  shouldTreatForgotPasswordAsSuccess,
} from "./auth-errors";

describe("mapAuthError", () => {
  test("maps invalid credentials without exposing internals", () => {
    expect(
      mapAuthError({
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "relation user does not exist",
      }),
    ).toBe(AUTH_ERROR_KEYS.invalidCredentials);
  });

  test("maps an existing account", () => {
    expect(mapAuthError({ code: "USER_ALREADY_EXISTS" })).toBe(
      AUTH_ERROR_KEYS.existingAccount,
    );
  });

  test("maps an expired reset token", () => {
    expect(mapAuthError({ code: "INVALID_TOKEN" })).toBe(
      AUTH_ERROR_KEYS.expiredResetToken,
    );
  });

  test("maps network failures", () => {
    expect(mapAuthError({ status: 0, message: "Failed to fetch" })).toBe(
      AUTH_ERROR_KEYS.networkFailure,
    );
  });

  test("falls back to a generic error", () => {
    expect(mapAuthError({ code: "SOME_INTERNAL_CODE", message: "stack" })).toBe(
      AUTH_ERROR_KEYS.unexpected,
    );
  });
});

describe("forgot-password privacy", () => {
  test("does not treat a missing user as a visible failure", () => {
    expect(shouldTreatForgotPasswordAsSuccess(null)).toBe(true);
    expect(shouldTreatForgotPasswordAsSuccess({ code: "USER_NOT_FOUND" })).toBe(
      true,
    );
    expect(
      shouldTreatForgotPasswordAsSuccess({
        code: "INVALID_EMAIL",
      }),
    ).toBe(false);
  });
});
