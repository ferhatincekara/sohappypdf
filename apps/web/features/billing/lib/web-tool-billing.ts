export type WebToolBilling = {
  plan: "free" | "pro";
  maxFilesPerOperation: number | null;
  maxFileSizeBytes: number;
  maxPagesPerFile: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseWebToolBilling(value: unknown): WebToolBilling | null {
  if (!isRecord(value)) {
    return null;
  }

  const billing = isRecord(value.billing) ? value.billing : value;

  if (billing.plan !== "free" && billing.plan !== "pro") {
    return null;
  }

  if (!isRecord(billing.limits)) {
    return null;
  }

  const maxFilesPerOperation = billing.limits.maxFilesPerOperation;
  const maxFileSizeBytes = billing.limits.maxFileSizeBytes;
  const maxPagesPerFile = billing.limits.maxPagesPerFile;

  if (
    maxFilesPerOperation !== null &&
    (typeof maxFilesPerOperation !== "number" ||
      !Number.isInteger(maxFilesPerOperation) ||
      maxFilesPerOperation < 1)
  ) {
    return null;
  }

  if (
    typeof maxFileSizeBytes !== "number" ||
    !Number.isInteger(maxFileSizeBytes) ||
    maxFileSizeBytes < 1
  ) {
    return null;
  }

  if (
    maxPagesPerFile !== null &&
    (typeof maxPagesPerFile !== "number" ||
      !Number.isInteger(maxPagesPerFile) ||
      maxPagesPerFile < 1)
  ) {
    return null;
  }

  return {
    plan: billing.plan,
    maxFilesPerOperation,
    maxFileSizeBytes,
    maxPagesPerFile,
  };
}
