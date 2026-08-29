import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";

export const CONVERSION_STATUSES = [
  "pending",
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

export type ConversionStatus = (typeof CONVERSION_STATUSES)[number];

const CONVERSION_STATUS_TRANSITIONS: Record<
  ConversionStatus,
  readonly ConversionStatus[]
> = {
  pending: ["queued", "cancelled", "failed"],
  queued: ["processing", "cancelled", "failed"],
  processing: ["completed", "failed"],
  completed: [],
  failed: [],
  cancelled: [],
};

export function isConversionStatus(value: string): value is ConversionStatus {
  return CONVERSION_STATUSES.some((status) => status === value);
}

export function canTransitionConversionStatus(
  from: ConversionStatus,
  to: ConversionStatus,
): boolean {
  return CONVERSION_STATUS_TRANSITIONS[from].includes(to);
}

export function assertConversionStatusTransition(
  from: ConversionStatus,
  to: ConversionStatus,
): void {
  if (canTransitionConversionStatus(from, to)) {
    return;
  }

  throw new AppError({
    code: APP_ERROR_CODES.CONFLICT,
    message: "Invalid conversion status transition",
  });
}
