export const PUBLIC_API_ERROR_CODES = [
  { code: "VALIDATION_ERROR", status: 400 },
  { code: "UNAUTHORIZED", status: 401 },
  { code: "FORBIDDEN", status: 403 },
  { code: "PLAN_LIMIT_REACHED", status: 403 },
  { code: "STORAGE_LIMIT_REACHED", status: 403 },
  { code: "API_KEY_LIMIT_REACHED", status: 403 },
  { code: "NOT_FOUND", status: 404 },
  { code: "CONFLICT", status: 409 },
  { code: "FILE_EXPIRED", status: 410 },
  { code: "FILE_TOO_LARGE", status: 413 },
  { code: "RATE_LIMITED", status: 429 },
  { code: "CONFIGURATION_ERROR", status: 500 },
  { code: "INTERNAL_ERROR", status: 500 },
] as const;

export const CONVERSION_POLL_STATUSES = [
  "pending",
  "queued",
  "processing",
] as const;

export const CONVERSION_TERMINAL_STATUSES = [
  "completed",
  "failed",
  "cancelled",
] as const;
