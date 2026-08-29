import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import type {
  AnonymousRateLimitSubject,
  RateLimitSubject,
} from "./rate-limit-identity.js";

const STABLE_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const UNIDENTIFIED_ANONYMOUS_SESSION = "unidentified";

export type AnonymousRateLimitKeys = {
  ip: string;
  session: string;
};

export function createAnonymousRateLimitKeys(
  subject: AnonymousRateLimitSubject,
): AnonymousRateLimitKeys {
  return {
    ip: `anonymous:ip:${assertStableId(subject.ipFingerprint)}`,
    session: `anonymous:session:${assertStableId(
      subject.sessionId.length === 0
        ? UNIDENTIFIED_ANONYMOUS_SESSION
        : subject.sessionId,
    )}`,
  };
}

export function createRateLimitKey(subject: RateLimitSubject): string {
  switch (subject.kind) {
    case "anonymous":
      return createAnonymousRateLimitKeys(subject).session;
    case "user":
      return `user:${assertStableId(subject.userId)}`;
    case "api-client":
      return `api:${assertStableId(subject.apiClientId)}`;
  }
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
