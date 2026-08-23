import {
  APP_ERROR_CODES,
  type AppErrorCode,
  type PublicError,
  toPublicError,
} from "@repo/core";
import type { Context } from "hono";
import type { AppEnv } from "../app-env.js";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
};

export function getRequestId(c: Context<AppEnv>): string {
  return c.get("requestId") ?? "unknown";
}

export function createErrorBody(
  c: Context<AppEnv>,
  code: string,
  message: string,
): ApiErrorBody {
  return {
    error: {
      code,
      message,
      requestId: getRequestId(c),
    },
  };
}

function logPublicError(c: Context<AppEnv>, publicError: PublicError): void {
  const logger = c.get("logger");

  if (logger === undefined) {
    return;
  }

  if (publicError.status >= 500) {
    logger.error("request failed", {
      status: publicError.status,
      code: publicError.code,
    });
    return;
  }

  logger.warn("request rejected", {
    status: publicError.status,
    code: publicError.code,
  });
}

function jsonError(
  c: Context<AppEnv>,
  code: AppErrorCode,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 413 | 429 | 500,
) {
  return c.json(createErrorBody(c, code, message), status);
}

export function notFoundHandler(c: Context<AppEnv>) {
  return jsonError(
    c,
    APP_ERROR_CODES.NOT_FOUND,
    "The requested resource could not be found",
    404,
  );
}

export function errorHandler(error: Error, c: Context<AppEnv>) {
  const publicError = toPublicError(error);
  logPublicError(c, publicError);

  switch (publicError.code) {
    case APP_ERROR_CODES.VALIDATION_ERROR:
      return jsonError(c, publicError.code, publicError.message, 400);
    case APP_ERROR_CODES.UNAUTHORIZED:
      return jsonError(c, publicError.code, publicError.message, 401);
    case APP_ERROR_CODES.FORBIDDEN:
    case APP_ERROR_CODES.PLAN_LIMIT_REACHED:
    case APP_ERROR_CODES.STORAGE_LIMIT_REACHED:
    case APP_ERROR_CODES.API_KEY_LIMIT_REACHED:
      return jsonError(c, publicError.code, publicError.message, 403);
    case APP_ERROR_CODES.FILE_TOO_LARGE:
      return jsonError(c, publicError.code, publicError.message, 413);
    case APP_ERROR_CODES.NOT_FOUND:
      return jsonError(c, publicError.code, publicError.message, 404);
    case APP_ERROR_CODES.CONFLICT:
      return jsonError(c, publicError.code, publicError.message, 409);
    case APP_ERROR_CODES.RATE_LIMITED:
      return jsonError(c, publicError.code, publicError.message, 429);
    case APP_ERROR_CODES.CONFIGURATION_ERROR:
    case APP_ERROR_CODES.INTERNAL_ERROR:
      return jsonError(c, publicError.code, publicError.message, 500);
  }
}
