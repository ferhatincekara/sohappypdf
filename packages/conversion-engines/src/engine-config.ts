export type ConversionEngineConfig = {
  conversionTimeoutMs: number;
  maxOutputFileSizeBytes: number;
  libreOfficeBin: string;
  ghostscriptBin: string;
  pdftoppmBin: string;
  pdftotextBin: string;
  pdftohtmlBin: string;
  qpdfBin: string;
  ocrMyPdfBin: string;
};

export const DEFAULT_CONVERSION_ENGINE_CONFIG: ConversionEngineConfig = {
  conversionTimeoutMs: 120_000,
  maxOutputFileSizeBytes: 150 * 1024 * 1024,
  libreOfficeBin: "soffice",
  ghostscriptBin: "gs",
  pdftoppmBin: "pdftoppm",
  pdftotextBin: "pdftotext",
  pdftohtmlBin: "pdftohtml",
  qpdfBin: "qpdf",
  ocrMyPdfBin: "ocrmypdf",
};

export const CONVERSION_NATIVE_BINARIES = [
  "soffice",
  "libreoffice",
  "pdftoppm",
  "pdftotext",
  "pdftohtml",
  "gs",
  "qpdf",
  "ocrmypdf",
] as const;
