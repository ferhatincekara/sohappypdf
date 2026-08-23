import axios from "axios";

export const API_KEY_ERROR_KEYS = {
  invalidName: "invalidName",
  unauthorized: "unauthorized",
  forbidden: "forbidden",
  notFound: "notFound",
  rateLimited: "rateLimited",
  apiKeyLimitReached: "apiKeyLimitReached",
  networkFailure: "networkFailure",
  unexpected: "unexpected",
} as const;

export type ApiKeyErrorKey =
  (typeof API_KEY_ERROR_KEYS)[keyof typeof API_KEY_ERROR_KEYS];

export type ApiKeyClientError = {
  code?: string;
  message?: string;
  status?: number;
  kind?: "api" | "network";
};

const SAFE_VALIDATION_MESSAGES: Record<string, ApiKeyErrorKey> = {
  "Invalid API key name": API_KEY_ERROR_KEYS.invalidName,
  "Invalid API key id": API_KEY_ERROR_KEYS.notFound,
};

export function toApiKeyClientError(error: unknown): ApiKeyClientError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const apiError = readApiErrorBody(error.response?.data);

    if (apiError !== undefined) {
      return {
        kind: "api",
        code: apiError.code,
        status,
        message: safeApiMessage(apiError.message),
      };
    }

    if (status === undefined || error.code === "ERR_NETWORK") {
      return { kind: "network", status: 0 };
    }

    return { kind: "api", status };
  }

  if (error instanceof Error && /network/i.test(error.message)) {
    return { kind: "network", status: 0 };
  }

  return { kind: "api" };
}

export function mapApiKeyError(
  error: ApiKeyClientError | null,
): ApiKeyErrorKey {
  if (error === null) {
    return API_KEY_ERROR_KEYS.unexpected;
  }

  if (error.kind === "network" || error.status === 0) {
    return API_KEY_ERROR_KEYS.networkFailure;
  }

  if (error.code === "VALIDATION_ERROR") {
    if (
      error.message !== undefined &&
      error.message in SAFE_VALIDATION_MESSAGES
    ) {
      return (
        SAFE_VALIDATION_MESSAGES[error.message] ?? API_KEY_ERROR_KEYS.unexpected
      );
    }

    return API_KEY_ERROR_KEYS.invalidName;
  }

  if (error.code === "NOT_FOUND" || error.status === 404) {
    return API_KEY_ERROR_KEYS.notFound;
  }

  if (error.code === "UNAUTHORIZED" || error.status === 401) {
    return API_KEY_ERROR_KEYS.unauthorized;
  }

  if (error.code === "FORBIDDEN" || error.status === 403) {
    return API_KEY_ERROR_KEYS.forbidden;
  }

  if (error.code === "RATE_LIMITED" || error.status === 429) {
    return API_KEY_ERROR_KEYS.rateLimited;
  }

  if (error.code === "API_KEY_LIMIT_REACHED") {
    return API_KEY_ERROR_KEYS.apiKeyLimitReached;
  }

  return API_KEY_ERROR_KEYS.unexpected;
}

export function mapUnknownApiKeyError(error: unknown): ApiKeyErrorKey {
  if (
    error instanceof Error &&
    error.name === "ApiKeyApiRequestError" &&
    "clientError" in error
  ) {
    return mapApiKeyError(error.clientError as ApiKeyClientError);
  }

  return mapApiKeyError(toApiKeyClientError(error));
}

function safeApiMessage(message: string | undefined): string | undefined {
  if (message === undefined) {
    return undefined;
  }

  if (message in SAFE_VALIDATION_MESSAGES) {
    return message;
  }

  return undefined;
}

function readApiErrorBody(
  data: unknown,
): { code: string; message?: string } | undefined {
  if (typeof data !== "object" || data === null || !("error" in data)) {
    return undefined;
  }

  const body = data.error;

  if (typeof body !== "object" || body === null || !("code" in body)) {
    return undefined;
  }

  if (typeof body.code !== "string") {
    return undefined;
  }

  const message =
    "message" in body && typeof body.message === "string"
      ? body.message
      : undefined;

  return { code: body.code, message };
}
