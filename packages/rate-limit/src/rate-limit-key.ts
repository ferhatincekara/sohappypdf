import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { RateLimitSubject } from "./rate-limit-identity.js";

const STABLE_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export function createRateLimitKey(subject: RateLimitSubject): string {
  switch (subject.kind) {
    case "anonymous":
      return `anonymous:ip:${normalizeAnonymousIp(subject.ip)}`;
    case "user":
      return `user:${assertStableId(subject.userId)}`;
    case "api-client":
      return `api:${assertStableId(subject.apiClientId)}`;
  }
}

function normalizeAnonymousIp(ip: string): string {
  const trimmed = ip.trim();

  if (trimmed.length === 0) {
    return "unknown";
  }

  return trimmed;
}

function assertStableId(value: string): string {
  if (!STABLE_ID_PATTERN.test(value)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid rate-limit identity",
    });
  }

  return value;
}
