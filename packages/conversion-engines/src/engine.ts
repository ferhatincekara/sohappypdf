import type {
  ConversionOptions,
  ConversionType,
  FileFormat,
} from "@repo/conversions";
import { mimeTypeForFileFormat } from "@repo/conversions";

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

export type ConversionEngineQuery = {
  type: ConversionType;
  sourceFormat: FileFormat;
  targetFormat: FileFormat;
};

export type ConversionEngine = {
  readonly name: string;
  readonly types: readonly ConversionType[];
  canHandle(type: ConversionType): boolean;
  supports(query: ConversionEngineQuery): boolean;
  convert(input: ConversionEngineInput): Promise<ConversionEngineResult>;
};

export function outputMimeType(format: FileFormat): string {
  return mimeTypeForFileFormat(format);
}

export function outputFilename(format: FileFormat): string {
  return `output.${format}`;
}
