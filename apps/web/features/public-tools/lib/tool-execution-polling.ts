import { isConversionExpired } from "@/features/conversions/lib/can-download-conversion";
import { conversionRefetchInterval } from "@/features/conversions/lib/conversion-polling";
import type { PublicConversion } from "@/features/conversions/types/conversion";

export function toolExecutionRefetchInterval(
  conversion:
    | Pick<PublicConversion, "status" | "expired" | "expiresAt">
    | undefined,
  now: Date = new Date(),
): number | false {
  if (conversion === undefined) {
    return false;
  }

  if (conversion.expired || isConversionExpired(conversion, now)) {
    return false;
  }

  return conversionRefetchInterval(conversion.status);
}
