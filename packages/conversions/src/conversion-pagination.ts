import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { ConversionRecord } from "./conversion-types.js";
import {
  DEFAULT_CONVERSION_LIST_LIMIT,
  MAX_CONVERSION_LIST_LIMIT,
} from "./conversion-types.js";

export type ConversionListCursor = {
  createdAt: Date;
  id: string;
};

export function encodeConversionListCursor(
  conversion: ConversionRecord,
): string {
  return Buffer.from(
    `${conversion.createdAt.toISOString()}|${conversion.id}`,
    "utf8",
  ).toString("base64url");
}

export function decodeConversionListCursor(
  cursor: string,
): ConversionListCursor {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const separator = decoded.lastIndexOf("|");
    const createdAtValue = decoded.slice(0, separator);
    const id = decoded.slice(separator + 1);
    const createdAt = new Date(createdAtValue);

    if (separator < 1 || id.length === 0 || Number.isNaN(createdAt.getTime())) {
      throw new Error("invalid cursor");
    }

    return { createdAt, id };
  } catch {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid pagination cursor",
    });
  }
}

export function assertConversionListLimit(limit: number | undefined): number {
  const value = limit ?? DEFAULT_CONVERSION_LIST_LIMIT;

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_CONVERSION_LIST_LIMIT
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid page size",
    });
  }

  return value;
}
