import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { PolarWebhookEvent, VerifyPolarWebhook } from "./billing-types.js";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

export function readWebhookHeader(
  headers: Record<string, string | undefined>,
  name: string,
): string | undefined {
  const direct = headers[name];

  if (direct !== undefined && direct.length > 0) {
    return direct;
  }

  const lower = name.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (
      key.toLowerCase() === lower &&
      value !== undefined &&
      value.length > 0
    ) {
      return value;
    }
  }

  return undefined;
}

export const verifyPolarWebhook: VerifyPolarWebhook = (
  body,
  headers,
  secret,
) => {
  try {
    const event = validateEvent(body, headers, secret);
    const record = asRecord(event);
    const id =
      (typeof record?.id === "string" ? record.id : undefined) ??
      readWebhookHeader(headers, "webhook-id");
    const type = typeof record?.type === "string" ? record.type : undefined;

    if (id === undefined || type === undefined) {
      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid billing event",
      });
    }

    return {
      id,
      type,
      data: record?.data,
    } satisfies PolarWebhookEvent;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof WebhookVerificationError) {
      throw new AppError({
        code: APP_ERROR_CODES.FORBIDDEN,
        message: "Invalid webhook signature",
        cause: error,
      });
    }

    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid billing event",
      cause: error,
    });
  }
};
