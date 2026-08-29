import { DEFAULT_FILE_RETENTION_MS } from "@sohappypdf/files";
import type { ConversionRecord } from "./conversion-types.js";

export const CONVERSION_RETENTION_MS = DEFAULT_FILE_RETENTION_MS;
export const CONVERSION_STALE_IN_PROGRESS_MS = 120_000;

export function conversionActiveAfter(
  now: Date,
  retentionMs: number = CONVERSION_RETENTION_MS,
): Date {
  return new Date(now.getTime() - retentionMs);
}

export function isConversionRecordExpired(
  conversion: {
    createdAt: Date;
    expiresAt?: Date | null;
  },
  now: Date,
  retentionMs: number = CONVERSION_RETENTION_MS,
): boolean {
  const expiresAt =
    conversion.expiresAt ??
    new Date(conversion.createdAt.getTime() + retentionMs);

  return expiresAt.getTime() <= now.getTime();
}

export function conversionInProgressReferenceAt(conversion: {
  status: ConversionRecord["status"];
  createdAt: Date;
  queuedAt?: Date | null;
  startedAt?: Date | null;
  updatedAt?: Date;
}): Date {
  if (conversion.status === "processing") {
    return conversion.startedAt ?? conversion.updatedAt ?? conversion.createdAt;
  }

  if (conversion.status === "queued" || conversion.status === "pending") {
    return conversion.queuedAt ?? conversion.createdAt;
  }

  return conversion.createdAt;
}

export function isConversionInProgressStale(
  conversion: {
    status: ConversionRecord["status"];
    createdAt: Date;
    queuedAt?: Date | null;
    startedAt?: Date | null;
    updatedAt?: Date;
  },
  now: Date,
  staleAfterMs: number = CONVERSION_STALE_IN_PROGRESS_MS,
): boolean {
  if (
    conversion.status !== "pending" &&
    conversion.status !== "queued" &&
    conversion.status !== "processing"
  ) {
    return false;
  }

  const started = conversionInProgressReferenceAt(conversion);
  return now.getTime() - started.getTime() >= staleAfterMs;
}
