/**
 * Processor IDs that currently have a real conversion engine.
 * Planned tools may reference future processor IDs that are not listed here.
 */
export const LIVE_PROCESSOR_IDS = [
  "office",
  "office-ocr",
  "ocr",
  "pdf-image",
  "pdf-text",
  "image-pdf",
  "pdf-manipulate",
  "pdf-edit",
  "pdf-security",
  "pdf-repair",
  "pdf-pdfa",
  "pdf-redact",
  "pdf-compare",
  "pdf-forms",
  "pdf-extract",
  "pdf-markdown",
] as const;

export type LiveProcessorId = (typeof LIVE_PROCESSOR_IDS)[number];

export function isLiveProcessorId(value: string): value is LiveProcessorId {
  return LIVE_PROCESSOR_IDS.some((id) => id === value);
}
