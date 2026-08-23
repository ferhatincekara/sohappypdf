import type { PublicConversion } from "../types/conversion";

export function canDownloadConversion(conversion: PublicConversion): boolean {
  return conversion.status === "completed" && conversion.outputFileId !== null;
}
