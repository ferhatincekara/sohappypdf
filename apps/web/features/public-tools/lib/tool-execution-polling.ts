import { isConversionExpired } from "@/features/conversions/lib/can-download-conversion";
import {
  CONVERSION_POLL_INTERVAL_MS,
  conversionRefetchInterval,
} from "@/features/conversions/lib/conversion-polling";
import type { PublicConversion } from "@/features/conversions/types/conversion";
import {
  isExpirationResponse,
  isMissingResourceResponse,
} from "@/features/public-tools/lib/public-tool-errors";

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

export function toolExecutionQueryRefetchInterval(input: {
  conversion:
    | Pick<PublicConversion, "status" | "expired" | "expiresAt">
    | undefined;
  hasExecutionId: boolean;
  error: unknown;
  now?: Date;
}): number | false {
  const interval = toolExecutionRefetchInterval(
    input.conversion,
    input.now ?? new Date(),
  );

  if (interval !== false) {
    return interval;
  }

  if (
    input.hasExecutionId &&
    input.conversion === undefined &&
    !isExpirationResponse(input.error) &&
    !isMissingResourceResponse(input.error)
  ) {
    return CONVERSION_POLL_INTERVAL_MS;
  }

  return false;
}
