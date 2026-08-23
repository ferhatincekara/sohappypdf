import type { PublicConversion } from "../types/conversion";
import { canDownloadConversion } from "./can-download-conversion";

export function conversionHistoryActions(conversion: PublicConversion): {
  canView: true;
  canDownload: boolean;
  canRetry: false;
} {
  return {
    canView: true,
    canDownload: canDownloadConversion(conversion),
    canRetry: false,
  };
}
