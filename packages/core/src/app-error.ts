export const APP_ERROR_CODES = {
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type AppErrorCode =
  (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];

export const APP_ERROR_STATUS: Record<AppErrorCode, number> = {
  CONFIGURATION_ERROR: 500,
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export type AppErrorOptions = {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor(options: AppErrorOptions) {
    super(
      options.message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "AppError";
    this.code = options.code;
    this.status = APP_ERROR_STATUS[options.code];
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export type PublicError = {
  code: AppErrorCode;
  status: number;
  message: string;
};

export function toPublicError(error: unknown): PublicError {
  if (isAppError(error)) {
    return {
      code: error.code,
      status: error.status,
      message: error.message,
    };
  }

  return {
    code: APP_ERROR_CODES.INTERNAL_ERROR,
    status: APP_ERROR_STATUS.INTERNAL_ERROR,
    message: "An unexpected error occurred",
  };
}
