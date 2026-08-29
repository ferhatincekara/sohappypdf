import { readPolarValidationSummary } from "@sohappypdf/billing";
import {
  APP_ERROR_CODES,
  type AppErrorCode,
  type PublicError,
  toPublicError,
} from "@sohappypdf/core";
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

function logPublicError(
  c: Context<AppEnv>,
  publicError: PublicError,
  error: Error,
): void {
  const logger = c.get("logger");

  if (logger === undefined) {
    return;
  }

  if (publicError.status >= 500) {
    logger.error("request failed", {
      status: publicError.status,
      code: publicError.code,
      name: error.name,
      message: error.message,
      causeName: error.cause instanceof Error ? error.cause.name : undefined,
      polarValidation: readPolarValidationSummary(error.cause),
    });
    return;
  }

  logger.warn("request rejected", {
    status: publicError.status,
    code: publicError.code,
    polarValidation: readPolarValidationSummary(error.cause),
  });
}

function jsonError(
  c: Context<AppEnv>,
  code: AppErrorCode,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 410 | 413 | 429 | 500,
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
  logPublicError(c, publicError, error);

  const status = isHandledErrorStatus(publicError.status)
    ? publicError.status
    : 500;

  return jsonError(c, publicError.code, publicError.message, status);
}

function isHandledErrorStatus(
  status: number,
): status is 400 | 401 | 403 | 404 | 409 | 410 | 413 | 429 | 500 {
  return (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 409 ||
    status === 410 ||
    status === 413 ||
    status === 429 ||
    status === 500
  );
}
