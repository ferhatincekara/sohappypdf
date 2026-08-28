export const AUTH_ERROR_KEYS = {
  invalidCredentials: "invalidCredentials",
  existingAccount: "existingAccount",
  invalidEmail: "invalidEmail",
  weakPassword: "weakPassword",
  expiredResetToken: "expiredResetToken",
  currentPasswordIncorrect: "currentPasswordIncorrect",
  networkFailure: "networkFailure",
  unexpected: "unexpected",
} as const;

export type AuthErrorKey =
  (typeof AUTH_ERROR_KEYS)[keyof typeof AUTH_ERROR_KEYS];

export type AuthClientError = {
  code?: string;
  message?: string;
  status?: number;
};

const ERROR_CODE_MAP: Record<string, AuthErrorKey> = {
  INVALID_EMAIL_OR_PASSWORD: AUTH_ERROR_KEYS.invalidCredentials,
  USER_NOT_FOUND: AUTH_ERROR_KEYS.invalidCredentials,
  CREDENTIAL_ACCOUNT_NOT_FOUND: AUTH_ERROR_KEYS.invalidCredentials,
  USER_ALREADY_EXISTS: AUTH_ERROR_KEYS.existingAccount,
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: AUTH_ERROR_KEYS.existingAccount,
  INVALID_EMAIL: AUTH_ERROR_KEYS.invalidEmail,
  CHANGE_EMAIL_DISABLED: AUTH_ERROR_KEYS.unexpected,
  INVALID_PASSWORD: AUTH_ERROR_KEYS.weakPassword,
  PASSWORD_TOO_SHORT: AUTH_ERROR_KEYS.weakPassword,
  PASSWORD_TOO_LONG: AUTH_ERROR_KEYS.weakPassword,
  INVALID_TOKEN: AUTH_ERROR_KEYS.expiredResetToken,
  EXPIRED_TOKEN: AUTH_ERROR_KEYS.expiredResetToken,
};

function isNetworkFailure(error: AuthClientError): boolean {
  if (error.status === 0) {
    return true;
  }

  const message = error.message?.toLowerCase() ?? "";

  return (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("networkerror")
  );
}

export function mapAuthError(error: AuthClientError | null): AuthErrorKey {
  if (error === null) {
    return AUTH_ERROR_KEYS.unexpected;
  }

  if (isNetworkFailure(error)) {
    return AUTH_ERROR_KEYS.networkFailure;
  }

  if (error.code !== undefined && error.code in ERROR_CODE_MAP) {
    return ERROR_CODE_MAP[error.code] ?? AUTH_ERROR_KEYS.unexpected;
  }

  if (error.status === 401) {
    return AUTH_ERROR_KEYS.invalidCredentials;
  }

  const message = error.message?.toLowerCase() ?? "";

  if (
    message.includes("invalid email or password") ||
    message.includes("invalid credentials")
  ) {
    return AUTH_ERROR_KEYS.invalidCredentials;
  }

  return AUTH_ERROR_KEYS.unexpected;
}

export function shouldTreatForgotPasswordAsSuccess(
  error: AuthClientError | null,
): boolean {
  return error === null || error.code === "USER_NOT_FOUND";
}
