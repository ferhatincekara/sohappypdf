import { describe, expect, test } from "bun:test";
import {
  ACCOUNT_SUSPENDED_ERROR_CODE,
  createAccountSuspendedApiError,
} from "./account-suspended.js";
import { toAuthHandlerErrorResponse } from "./auth-api-error.js";

describe("toAuthHandlerErrorResponse", () => {
  test("serializes a Better Auth API error for the HTTP handler", async () => {
    const response = toAuthHandlerErrorResponse(
      createAccountSuspendedApiError(),
    );

    expect(response).toBeInstanceOf(Response);
    expect(response?.status).toBe(403);
    expect(await response?.json()).toMatchObject({
      code: ACCOUNT_SUSPENDED_ERROR_CODE,
      message: "Account is suspended",
    });
  });

  test("ignores unrelated errors", () => {
    expect(toAuthHandlerErrorResponse(new Error("boom"))).toBeUndefined();
  });
});
