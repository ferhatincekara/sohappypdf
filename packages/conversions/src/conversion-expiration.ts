import { DEFAULT_FILE_RETENTION_MS } from "@sohappypdf/files";

export const CONVERSION_RETENTION_MS = DEFAULT_FILE_RETENTION_MS;

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
