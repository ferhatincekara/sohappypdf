const FAILURE_CODES = [
  "unsupported_conversion",
  "invalid_source_format",
  "invalid_target_format",
  "invalid_options",
  "source_file_unavailable",
  "output_file_unavailable",
  "processing_failed",
  "cancelled",
] as const;

export type ConversionFailureCode = (typeof FAILURE_CODES)[number];

export function safeConversionFailureKey(
  code: string | undefined,
): ConversionFailureCode {
  if (code !== undefined && isFailureCode(code)) {
    return code;
  }

  return "processing_failed";
}

function isFailureCode(value: string): value is ConversionFailureCode {
  return FAILURE_CODES.some((code) => code === value);
}
