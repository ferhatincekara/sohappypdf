import { APIError } from "better-auth";

export const ACCOUNT_SUSPENDED_ERROR_CODE = "ACCOUNT_SUSPENDED";
export const ACCOUNT_SUSPENDED_ERROR_MESSAGE = "Account is suspended";

export function createAccountSuspendedApiError(): APIError {
  return new APIError("FORBIDDEN", {
    code: ACCOUNT_SUSPENDED_ERROR_CODE,
    message: ACCOUNT_SUSPENDED_ERROR_MESSAGE,
  });
}

export function isAccountSuspendedMessage(
  message: string | undefined,
): boolean {
  return (message ?? "").toLowerCase().includes("account is suspended");
}
