import type { PublicConversion } from "@/features/conversions/types/conversion";

export const CONVERSION_RETENTION_MS = 2 * 60 * 60 * 1000;

export function isConversionExpired(
  conversion: Pick<PublicConversion, "expired" | "expiresAt"> & {
    createdAt?: string;
  },
  now: Date = new Date(),
): boolean {
  if (conversion.expired) {
    return true;
  }

  if (conversion.expiresAt !== null) {
    return new Date(conversion.expiresAt).getTime() <= now.getTime();
  }

  if (conversion.createdAt === undefined) {
    return false;
  }

  return (
    new Date(conversion.createdAt).getTime() + CONVERSION_RETENTION_MS <=
    now.getTime()
  );
}

export function canDownloadConversion(
  conversion: PublicConversion,
  now: Date = new Date(),
): boolean {
  if (isConversionExpired(conversion, now)) {
    return false;
  }

  return conversion.status === "completed" && conversion.outputFileId !== null;
}
