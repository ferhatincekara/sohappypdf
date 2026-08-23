import axios from "axios";

export const CONVERSION_ERROR_KEYS = {
  invalidFile: "invalidFile",
  targetRequired: "targetRequired",
  typeRequired: "typeRequired",
  unsupportedConversion: "unsupportedConversion",
  invalidTargetFormat: "invalidTargetFormat",
  notFound: "notFound",
  sourceUnavailable: "sourceUnavailable",
  conflict: "conflict",
  unauthorized: "unauthorized",
  rateLimited: "rateLimited",
  networkFailure: "networkFailure",
  unexpected: "unexpected",
} as const;

export type ConversionErrorKey =
  (typeof CONVERSION_ERROR_KEYS)[keyof typeof CONVERSION_ERROR_KEYS];

export type ConversionClientError = {
  code?: string;
  message?: string;
  status?: number;
  kind?: "api" | "network";
};

const SAFE_VALIDATION_MESSAGES: Record<string, ConversionErrorKey> = {
  "Unsupported conversion": CONVERSION_ERROR_KEYS.unsupportedConversion,
  "Invalid target format": CONVERSION_ERROR_KEYS.invalidTargetFormat,
  "Invalid file id": CONVERSION_ERROR_KEYS.invalidFile,
  "Invalid conversion id": CONVERSION_ERROR_KEYS.notFound,
};

const SAFE_CONFLICT_MESSAGES: Record<string, ConversionErrorKey> = {
  "Source file unavailable": CONVERSION_ERROR_KEYS.sourceUnavailable,
};

export function toConversionClientError(error: unknown): ConversionClientError {
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

export function mapConversionError(
  error: ConversionClientError | null,
): ConversionErrorKey {
  if (error === null) {
    return CONVERSION_ERROR_KEYS.unexpected;
  }

  if (error.kind === "network" || error.status === 0) {
    return CONVERSION_ERROR_KEYS.networkFailure;
  }

  if (error.code === "VALIDATION_ERROR") {
    if (
      error.message !== undefined &&
      error.message in SAFE_VALIDATION_MESSAGES
    ) {
      return (
        SAFE_VALIDATION_MESSAGES[error.message] ??
        CONVERSION_ERROR_KEYS.unexpected
      );
    }

    return CONVERSION_ERROR_KEYS.unsupportedConversion;
  }

  if (error.code === "CONFLICT" || error.status === 409) {
    if (
      error.message !== undefined &&
      error.message in SAFE_CONFLICT_MESSAGES
    ) {
      return (
        SAFE_CONFLICT_MESSAGES[error.message] ?? CONVERSION_ERROR_KEYS.conflict
      );
    }

    return CONVERSION_ERROR_KEYS.conflict;
  }

  if (error.code === "NOT_FOUND" || error.status === 404) {
    return CONVERSION_ERROR_KEYS.notFound;
  }

  if (error.code === "UNAUTHORIZED" || error.status === 401) {
    return CONVERSION_ERROR_KEYS.unauthorized;
  }

  if (error.code === "RATE_LIMITED" || error.status === 429) {
    return CONVERSION_ERROR_KEYS.rateLimited;
  }

  return CONVERSION_ERROR_KEYS.unexpected;
}

export function mapUnknownConversionError(error: unknown): ConversionErrorKey {
  if (
    error instanceof Error &&
    error.name === "ConversionApiRequestError" &&
    "clientError" in error
  ) {
    return mapConversionError(error.clientError as ConversionClientError);
  }

  return mapConversionError(toConversionClientError(error));
}

function safeApiMessage(message: string | undefined): string | undefined {
  if (message === undefined) {
    return undefined;
  }

  if (
    message in SAFE_VALIDATION_MESSAGES ||
    message in SAFE_CONFLICT_MESSAGES
  ) {
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
