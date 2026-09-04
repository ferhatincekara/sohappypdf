import { describe, expect, test } from "bun:test";
import {
  ACCOUNT_SUSPENDED_ERROR_CODE,
  ACCOUNT_SUSPENDED_ERROR_MESSAGE,
  createAccountSuspendedApiError,
  isAccountSuspendedMessage,
} from "./account-suspended.js";

describe("account suspended auth error", () => {
  test("builds a Better Auth forbidden response", () => {
    const error = createAccountSuspendedApiError();

    expect(error.statusCode).toBe(403);
    expect(error.body).toMatchObject({
      code: ACCOUNT_SUSPENDED_ERROR_CODE,
      message: ACCOUNT_SUSPENDED_ERROR_MESSAGE,
    });
  });

  test("recognizes the public suspension message", () => {
    expect(isAccountSuspendedMessage("Account is suspended")).toBe(true);
    expect(isAccountSuspendedMessage("account is suspended.")).toBe(true);
    expect(isAccountSuspendedMessage("Unable to sign in")).toBe(false);
    expect(isAccountSuspendedMessage(undefined)).toBe(false);
  });
});
