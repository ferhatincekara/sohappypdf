import { canDownloadConversion } from "@/features/conversions/lib/can-download-conversion";
import type { PublicConversion } from "@/features/conversions/types/conversion";

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
