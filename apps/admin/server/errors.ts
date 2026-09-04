import { isAppError, toPublicError } from "@sohappypdf/core";

export function toAdminActionError(error: unknown): Error {
  const publicError = toPublicError(error);

  if (isAppError(error)) {
    return new Error(publicError.message);
  }

  return new Error("Unable to complete the administrator action.");
}
