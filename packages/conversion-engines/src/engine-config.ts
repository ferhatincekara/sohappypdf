export type ConversionEngineConfig = {
  conversionTimeoutMs: number;
  maxOutputFileSizeBytes: number;
  libreOfficeBin: string;
  ghostscriptBin: string;
  pdftoppmBin: string;
  pdftotextBin: string;
};

export const DEFAULT_CONVERSION_ENGINE_CONFIG: ConversionEngineConfig = {
  conversionTimeoutMs: 120_000,
  maxOutputFileSizeBytes: 150 * 1024 * 1024,
  libreOfficeBin: "soffice",
  ghostscriptBin: "gs",
  pdftoppmBin: "pdftoppm",
  pdftotextBin: "pdftotext",
};

export const CONVERSION_NATIVE_BINARIES = [
  "soffice",
  "libreoffice",
  "pdftoppm",
  "pdftotext",
  "gs",
] as const;
