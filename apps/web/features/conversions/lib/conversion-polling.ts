import type { ConversionStatus } from "../types/conversion";

export const ACTIVE_CONVERSION_STATUSES: readonly ConversionStatus[] = [
  "pending",
  "queued",
  "processing",
];

export const TERMINAL_CONVERSION_STATUSES: readonly ConversionStatus[] = [
  "completed",
  "failed",
  "cancelled",
];

export const CONVERSION_POLL_INTERVAL_MS = 2_500;

export function isActiveConversionStatus(
  status: ConversionStatus | undefined,
): boolean {
  if (status === undefined) {
    return false;
  }

  return ACTIVE_CONVERSION_STATUSES.some((value) => value === status);
}

export function conversionRefetchInterval(
  status: ConversionStatus | undefined,
): number | false {
  return isActiveConversionStatus(status) ? CONVERSION_POLL_INTERVAL_MS : false;
}

export function conversionListRefetchInterval(
  statuses: readonly ConversionStatus[],
): number | false {
  return statuses.some((status) => isActiveConversionStatus(status))
    ? CONVERSION_POLL_INTERVAL_MS
    : false;
}
