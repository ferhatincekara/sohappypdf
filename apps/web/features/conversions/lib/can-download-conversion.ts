import type { PublicConversion } from "../types/conversion";

export function isConversionExpired(
  conversion: Pick<PublicConversion, "expired" | "expiresAt">,
  now: Date = new Date(),
): boolean {
  if (conversion.expired) {
    return true;
  }

  if (conversion.expiresAt === null) {
    return false;
  }

  return new Date(conversion.expiresAt).getTime() <= now.getTime();
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
