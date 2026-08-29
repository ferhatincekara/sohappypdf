import type { PublicConversion } from "@/features/conversions/types/conversion";

export const CONVERSION_STALE_IN_PROGRESS_MS = 120_000;

export function isPublicConversionInProgressStale(
  conversion: Pick<
    PublicConversion,
    "status" | "createdAt" | "queuedAt" | "startedAt" | "updatedAt"
  >,
  now: Date = new Date(),
): boolean {
  if (
    conversion.status !== "pending" &&
    conversion.status !== "queued" &&
    conversion.status !== "processing"
  ) {
    return false;
  }

  const reference =
    conversion.status === "processing"
      ? (conversion.startedAt ?? conversion.updatedAt ?? conversion.createdAt)
      : (conversion.queuedAt ?? conversion.createdAt);
  const startedAt = Date.parse(reference);

  if (Number.isNaN(startedAt)) {
    return false;
  }

  return now.getTime() - startedAt >= CONVERSION_STALE_IN_PROGRESS_MS;
}
