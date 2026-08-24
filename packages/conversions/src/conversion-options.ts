import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { FileFormat } from "./conversion-format.js";
import type { ConversionType } from "./conversion-type.js";

const MAX_MERGE_ADDITIONAL_FILES = 20;
const MIN_DPI = 72;
const MAX_DPI = 600;
const SENSITIVE_OPTION_KEYS = new Set([
  "password",
  "userpassword",
  "ownerpassword",
  "secret",
]);

export const COMPRESSION_LEVELS = ["low", "medium", "high"] as const;
export type CompressionLevel = (typeof COMPRESSION_LEVELS)[number];

export const ROTATION_DEGREES = [90, 180, 270] as const;
export type RotationDegrees = (typeof ROTATION_DEGREES)[number];

export const OCR_OUTPUT_MODES = ["pdf", "txt"] as const;
export type OcrOutputMode = (typeof OCR_OUTPUT_MODES)[number];

export type PdfPageImageOptions = {
  type: "pdf-to-jpg" | "pdf-to-png";
  page?: number;
  quality?: number;
  dpi?: number;
};

export type OfficeConversionOptions = {
  type:
    | "pdf-to-word"
    | "pdf-to-excel"
    | "pdf-to-powerpoint"
    | "word-to-pdf"
    | "excel-to-pdf"
    | "powerpoint-to-pdf"
    | "office-to-pdf"
    | "jpg-to-pdf"
    | "png-to-pdf"
    | "pdf-to-txt";
};

export type OfficeOcrConversionOptions = {
  type: "pdf-to-word-ocr" | "pdf-to-excel-ocr";
  language: string;
};

export type MergePdfOptions = {
  type: "merge-pdf";
  additionalFileIds: string[];
};

export type SplitPdfOptions = {
  type: "split-pdf";
  ranges?: readonly { start: number; end: number }[];
};

export type CompressPdfOptions = {
  type: "compress-pdf";
  level: CompressionLevel;
};

export type RotatePdfOptions = {
  type: "rotate-pdf";
  degrees: RotationDegrees;
  pages?: number[];
};

export type OrganizePdfOptions = {
  type: "organize-pdf";
  order: number[];
};

export type RemovePagesOptions = {
  type: "remove-pages";
  pages: number[];
};

export type ReorderPagesOptions = {
  type: "reorder-pages";
  order: number[];
};

export type CropPdfOptions = {
  type: "crop-pdf";
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
};

export type RepairPdfOptions = {
  type: "repair-pdf";
};

export type WatermarkPdfOptions = {
  type: "watermark-pdf";
  text: string;
  opacity?: number;
};

export type PageNumbersPdfOptions = {
  type: "page-numbers-pdf";
  startAt?: number;
};

export type ProtectPdfOptions = {
  type: "protect-pdf";
  password: string;
};

export type UnlockPdfOptions = {
  type: "unlock-pdf";
  password: string;
};

export type OcrOptions = {
  type: "ocr-pdf" | "ocr-image";
  language: string;
  outputMode: OcrOutputMode;
};

export type ConversionOptions =
  | PdfPageImageOptions
  | OfficeConversionOptions
  | OfficeOcrConversionOptions
  | MergePdfOptions
  | SplitPdfOptions
  | CompressPdfOptions
  | RotatePdfOptions
  | OrganizePdfOptions
  | RemovePagesOptions
  | ReorderPagesOptions
  | CropPdfOptions
  | RepairPdfOptions
  | WatermarkPdfOptions
  | PageNumbersPdfOptions
  | ProtectPdfOptions
  | UnlockPdfOptions
  | OcrOptions;

export type ParseConversionOptionsContext = {
  targetFormat?: FileFormat;
};

function invalidOptions(): AppError {
  return new AppError({
    code: APP_ERROR_CODES.VALIDATION_ERROR,
    message: "Invalid conversion options",
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNoSensitiveKeys(
  record: Record<string, unknown>,
  type: ConversionType,
): void {
  for (const key of Object.keys(record)) {
    const normalized = key.toLowerCase();

    if (normalized === "password") {
      if (type !== "protect-pdf" && type !== "unlock-pdf") {
        throw invalidOptions();
      }
      continue;
    }

    if (SENSITIVE_OPTION_KEYS.has(normalized)) {
      throw invalidOptions();
    }
  }
}

function assertAllowedKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
): void {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      throw invalidOptions();
    }
  }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function assertOptionalPositiveInteger(
  value: unknown,
  maximum?: number,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isPositiveInteger(value)) {
    throw invalidOptions();
  }

  if (maximum !== undefined && value > maximum) {
    throw invalidOptions();
  }

  return value;
}

function assertOptionalDpi(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < MIN_DPI ||
    value > MAX_DPI
  ) {
    throw invalidOptions();
  }

  return value;
}

function parseLanguage(value: unknown): string {
  if (typeof value !== "string") {
    throw invalidOptions();
  }

  const language = value.trim();

  if (!/^[a-z]{2,8}(?:[-_][a-zA-Z]{2,8})?$/.test(language)) {
    throw invalidOptions();
  }

  return language;
}

function parseAdditionalFileIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw invalidOptions();
  }

  if (value.length > MAX_MERGE_ADDITIONAL_FILES) {
    throw invalidOptions();
  }

  const ids: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      throw invalidOptions();
    }

    if (ids.includes(item)) {
      throw invalidOptions();
    }

    ids.push(item);
  }

  return ids;
}

function parsePageList(value: unknown, minimumLength = 1): number[] {
  if (!Array.isArray(value) || value.length < minimumLength) {
    throw invalidOptions();
  }

  const pages: number[] = [];

  for (const item of value) {
    if (!isPositiveInteger(item)) {
      throw invalidOptions();
    }

    if (pages.includes(item)) {
      throw invalidOptions();
    }

    pages.push(item);
  }

  return pages;
}

function parsePassword(value: unknown): string {
  if (typeof value !== "string") {
    throw invalidOptions();
  }

  const password = value.trim();

  if (password.length < 1 || password.length > 128) {
    throw invalidOptions();
  }

  return password;
}

function parseNonNegativeNumber(value: unknown, maximum = 500): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw invalidOptions();
  }

  if (value > maximum) {
    throw invalidOptions();
  }

  return value;
}

function parseOpacity(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || value < 0.05 || value > 1) {
    throw invalidOptions();
  }

  return value;
}

function parseWatermarkText(value: unknown): string {
  if (typeof value !== "string") {
    throw invalidOptions();
  }

  const text = value.trim();

  if (text.length < 1 || text.length > 200) {
    throw invalidOptions();
  }

  return text;
}

function parseRanges(
  value: unknown,
): readonly { start: number; end: number }[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw invalidOptions();
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      throw invalidOptions();
    }

    assertAllowedKeys(item, ["start", "end"]);

    const start = item.start;
    const end = item.end;

    if (
      typeof start !== "number" ||
      typeof end !== "number" ||
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 1 ||
      end < start
    ) {
      throw invalidOptions();
    }

    return { start, end };
  });
}

function isCompressionLevel(value: unknown): value is CompressionLevel {
  return COMPRESSION_LEVELS.some((level) => level === value);
}

function isRotationDegrees(value: unknown): value is RotationDegrees {
  return ROTATION_DEGREES.some((degrees) => degrees === value);
}

function isOcrOutputMode(value: unknown): value is OcrOutputMode {
  return OCR_OUTPUT_MODES.some((mode) => mode === value);
}

function resolveOcrOutputMode(
  value: unknown,
  targetFormat: FileFormat | undefined,
): OcrOutputMode {
  if (value === undefined) {
    if (targetFormat === "txt") {
      return "txt";
    }

    return "pdf";
  }

  if (!isOcrOutputMode(value)) {
    throw invalidOptions();
  }

  return value;
}

export function parseConversionOptions(
  type: ConversionType,
  options: unknown,
  context: ParseConversionOptionsContext = {},
): ConversionOptions {
  if (options === undefined) {
    return parseConversionOptions(type, { type }, context);
  }

  if (!isRecord(options)) {
    throw invalidOptions();
  }

  assertNoSensitiveKeys(options, type);

  if (options.type !== undefined && options.type !== type) {
    throw invalidOptions();
  }

  const record: Record<string, unknown> = { ...options, type };

  switch (type) {
    case "pdf-to-jpg":
    case "pdf-to-png": {
      assertAllowedKeys(record, ["type", "page", "quality", "dpi"]);
      const page = assertOptionalPositiveInteger(record.page);
      const quality = assertOptionalPositiveInteger(record.quality, 100);
      const dpi = assertOptionalDpi(record.dpi);

      return {
        type,
        ...(page === undefined ? {} : { page }),
        ...(quality === undefined ? {} : { quality }),
        ...(dpi === undefined ? {} : { dpi }),
      };
    }
    case "merge-pdf": {
      assertAllowedKeys(record, ["type", "additionalFileIds"]);
      return {
        type,
        additionalFileIds: parseAdditionalFileIds(record.additionalFileIds),
      };
    }
    case "split-pdf": {
      assertAllowedKeys(record, ["type", "ranges"]);
      const ranges = parseRanges(record.ranges);

      return {
        type,
        ...(ranges === undefined ? {} : { ranges }),
      };
    }
    case "compress-pdf": {
      assertAllowedKeys(record, ["type", "level"]);
      const level = record.level ?? "medium";

      if (!isCompressionLevel(level)) {
        throw invalidOptions();
      }

      return { type, level };
    }
    case "rotate-pdf": {
      assertAllowedKeys(record, ["type", "degrees", "pages"]);

      if (!isRotationDegrees(record.degrees)) {
        throw invalidOptions();
      }

      const pages =
        record.pages === undefined ? undefined : parsePageList(record.pages, 1);

      return {
        type,
        degrees: record.degrees,
        ...(pages === undefined ? {} : { pages }),
      };
    }
    case "organize-pdf":
    case "reorder-pages": {
      assertAllowedKeys(record, ["type", "order"]);
      return {
        type,
        order: parsePageList(record.order, 1),
      };
    }
    case "remove-pages": {
      assertAllowedKeys(record, ["type", "pages"]);
      return {
        type,
        pages: parsePageList(record.pages, 1),
      };
    }
    case "crop-pdf": {
      assertAllowedKeys(record, [
        "type",
        "marginTop",
        "marginRight",
        "marginBottom",
        "marginLeft",
      ]);
      return {
        type,
        marginTop: parseNonNegativeNumber(record.marginTop ?? 0),
        marginRight: parseNonNegativeNumber(record.marginRight ?? 0),
        marginBottom: parseNonNegativeNumber(record.marginBottom ?? 0),
        marginLeft: parseNonNegativeNumber(record.marginLeft ?? 0),
      };
    }
    case "repair-pdf": {
      assertAllowedKeys(record, ["type"]);
      return { type };
    }
    case "watermark-pdf": {
      assertAllowedKeys(record, ["type", "text", "opacity"]);
      const opacity = parseOpacity(record.opacity);

      return {
        type,
        text: parseWatermarkText(record.text),
        ...(opacity === undefined ? {} : { opacity }),
      };
    }
    case "page-numbers-pdf": {
      assertAllowedKeys(record, ["type", "startAt"]);
      const startAt = assertOptionalPositiveInteger(record.startAt, 10_000);

      return {
        type,
        ...(startAt === undefined ? {} : { startAt }),
      };
    }
    case "protect-pdf": {
      assertAllowedKeys(record, ["type", "password"]);
      return {
        type,
        password: parsePassword(record.password),
      };
    }
    case "unlock-pdf": {
      assertAllowedKeys(record, ["type", "password"]);
      return {
        type,
        password: parsePassword(record.password),
      };
    }
    case "ocr-pdf":
    case "ocr-image": {
      assertAllowedKeys(record, ["type", "language", "outputMode"]);
      return {
        type,
        language: parseLanguage(record.language ?? "eng"),
        outputMode: resolveOcrOutputMode(
          record.outputMode,
          context.targetFormat,
        ),
      };
    }
    case "pdf-to-word":
    case "pdf-to-excel":
    case "pdf-to-powerpoint":
    case "word-to-pdf":
    case "excel-to-pdf":
    case "powerpoint-to-pdf":
    case "office-to-pdf":
    case "jpg-to-pdf":
    case "png-to-pdf":
    case "pdf-to-txt": {
      assertAllowedKeys(record, ["type"]);
      return { type };
    }
    case "pdf-to-word-ocr":
    case "pdf-to-excel-ocr": {
      assertAllowedKeys(record, ["type", "language"]);
      return {
        type,
        language: parseLanguage(record.language ?? "eng"),
      };
    }
  }
}
