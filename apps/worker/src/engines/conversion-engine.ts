import type {
  ConversionOptions,
  ConversionType,
  FileFormat,
} from "@repo/conversions";

export type ConversionEngineInput = {
  type: ConversionType;
  sourcePath: string;
  outputDirectory: string;
  sourceFormat: FileFormat;
  targetFormat: FileFormat;
  options: ConversionOptions;
  additionalSourcePaths: readonly string[];
};

export type ConversionEngineResult = {
  outputPath: string;
  mimeType: string;
  filename: string;
};

export type ConversionEngine = {
  readonly name: string;
  canHandle(type: ConversionType): boolean;
  convert(input: ConversionEngineInput): Promise<ConversionEngineResult>;
};

export const OUTPUT_MIME_TYPES = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
  txt: "text/plain",
} as const;
