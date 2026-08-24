import type { ConversionFailureCode } from "@repo/conversions";

const REFUNDABLE_FAILURE_CODES = new Set<ConversionFailureCode>([
  "processing_failed",
]);

export function shouldRefundAiCredits(
  errorCode: ConversionFailureCode,
): boolean {
  return REFUNDABLE_FAILURE_CODES.has(errorCode);
}
