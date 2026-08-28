import type { FieldErrors, FieldValues } from "react-hook-form";

export function firstFormErrorMessage<T extends FieldValues>(
  errors: FieldErrors<T>,
): string | undefined {
  for (const value of Object.values(errors)) {
    if (value === undefined) {
      continue;
    }

    if (
      typeof value === "object" &&
      "message" in value &&
      typeof value.message === "string" &&
      value.message.length > 0
    ) {
      return value.message;
    }
  }

  return undefined;
}
