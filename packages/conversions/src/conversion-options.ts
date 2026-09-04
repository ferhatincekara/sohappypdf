import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import type { FileFormat } from "./conversion-format.js";
import type { ConversionType } from "./conversion-type.js";

const MAX_MERGE_ADDITIONAL_FILES = 20;
const MAX_SCAN_ADDITIONAL_FILES = 49;
const MAX_IMAGE_ADDITIONAL_FILES = 19;
const MAX_REDACT_REGIONS = 200;
const MAX_EDIT_OPERATIONS = 400;
const MAX_FORM_FIELDS = 200;
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

export const AI_SUMMARIZER_OUTPUT_MODES = ["txt", "md"] as const;
export type AiSummarizerOutputMode =
  (typeof AI_SUMMARIZER_OUTPUT_MODES)[number];

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
    | "pdf-to-txt";
};

export type ImageToPdfOptions = {
  type: "jpg-to-pdf" | "png-to-pdf";
  additionalFileIds?: string[];
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

export type ExtractPagesOptions = {
  type: "extract-pages";
  ranges?: readonly { start: number; end: number }[];
  pages?: number[];
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

export const ORGANIZE_ROTATIONS = [0, 90, 180, 270] as const;
export type OrganizeRotation = (typeof ORGANIZE_ROTATIONS)[number];

export type OrganizePdfOptions = {
  type: "organize-pdf";
  order: number[];
  rotations?: OrganizeRotation[];
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

export type PdfToPdfaOptions = {
  type: "pdf-to-pdfa";
};

/**
 * Page editing. Existing text is covered then rewritten; new marks are stamped.
 * Supported: text, erase, rectangle/highlight, optional image stamp
 * (via additionalFileIds[0]).
 */
export type EditPdfOptions = {
  type: "edit-pdf";
  operations: readonly EditPdfOperation[];
  additionalFileIds?: string[];
};

export const EDIT_PDF_FONTS = [
  "helvetica",
  "helveticaBold",
  "times",
  "timesBold",
  "courier",
  "courierBold",
] as const;

export type EditPdfFont = (typeof EDIT_PDF_FONTS)[number];

export type EditPdfOperation =
  | {
      kind: "text";
      page: number;
      x: number;
      y: number;
      text: string;
      size?: number;
      color?: string;
      font?: EditPdfFont;
    }
  | {
      kind: "erase";
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      kind: "rectangle";
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
      style?: "fill" | "highlight";
    }
  | {
      kind: "image";
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
    };

/**
 * Visual signature stamp only — not a cryptographic / PAdES digital signature.
 * Provide a signature image via additionalFileIds[0] or fall back to text.
 */
export type SignPdfOptions = {
  type: "sign-pdf";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  additionalFileIds?: string[];
};

export type RedactPdfOptions = {
  type: "redact-pdf";
  regions: readonly {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
};

export type ComparePdfOptions = {
  type: "compare-pdf";
  additionalFileIds: string[];
};

export type PdfFormsOptions = {
  type: "pdf-forms";
  fields: Record<string, string>;
  flatten?: boolean;
};

export type ScanToPdfOptions = {
  type: "scan-to-pdf";
  additionalFileIds?: string[];
};

export type PdfExtractOptions = {
  type: "pdf-extract";
};

export type PdfToMarkdownOptions = {
  type: "pdf-to-markdown";
};

export type AiSummarizerOptions = {
  type: "ai-summarizer";
  language: string;
  outputMode: AiSummarizerOutputMode;
};

export type TranslatePdfOptions = {
  type: "translate-pdf";
  targetLanguage: string;
  sourceLanguage?: string;
};

export type ConversionOptions =
  | PdfPageImageOptions
  | OfficeConversionOptions
  | ImageToPdfOptions
  | OfficeOcrConversionOptions
  | MergePdfOptions
  | SplitPdfOptions
  | ExtractPagesOptions
  | CompressPdfOptions
  | RotatePdfOptions
  | OrganizePdfOptions
  | RemovePagesOptions
  | ReorderPagesOptions
  | CropPdfOptions
  | RepairPdfOptions
  | PdfToPdfaOptions
  | WatermarkPdfOptions
  | PageNumbersPdfOptions
  | EditPdfOptions
  | ProtectPdfOptions
  | UnlockPdfOptions
  | SignPdfOptions
  | RedactPdfOptions
  | ComparePdfOptions
  | PdfFormsOptions
  | ScanToPdfOptions
  | PdfExtractOptions
  | PdfToMarkdownOptions
  | OcrOptions
  | AiSummarizerOptions
  | TranslatePdfOptions;

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

function parseAdditionalFileIds(
  value: unknown,
  maxFiles = MAX_MERGE_ADDITIONAL_FILES,
): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw invalidOptions();
  }

  if (value.length > maxFiles) {
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

function parseOptionalAdditionalFileIds(
  value: unknown,
  maxFiles: number,
): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return parseAdditionalFileIds(value, maxFiles);
}

function parseNonNegativeCoordinate(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw invalidOptions();
  }

  return value;
}

function parsePositiveCoordinate(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw invalidOptions();
  }

  return value;
}

function parseEditOperations(value: unknown): EditPdfOperation[] {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > MAX_EDIT_OPERATIONS
  ) {
    throw invalidOptions();
  }

  const operations: EditPdfOperation[] = [];

  for (const item of value) {
    if (!isRecord(item) || typeof item.kind !== "string") {
      throw invalidOptions();
    }

    const page = assertOptionalPositiveInteger(item.page);
    if (page === undefined) {
      throw invalidOptions();
    }

    if (item.kind === "text") {
      if (typeof item.text !== "string" || item.text.trim().length === 0) {
        throw invalidOptions();
      }

      const size = assertOptionalPositiveInteger(item.size, 96);
      const color =
        typeof item.color === "string" && /^#[0-9a-fA-F]{6}$/.test(item.color)
          ? item.color.toLowerCase()
          : undefined;
      const font =
        typeof item.font === "string" &&
        (EDIT_PDF_FONTS as readonly string[]).includes(item.font)
          ? (item.font as EditPdfFont)
          : undefined;
      operations.push({
        kind: "text",
        page,
        x: parseNonNegativeCoordinate(item.x),
        y: parseNonNegativeCoordinate(item.y),
        text: item.text.trim().slice(0, 500),
        ...(size === undefined ? {} : { size }),
        ...(color === undefined ? {} : { color }),
        ...(font === undefined ? {} : { font }),
      });
      continue;
    }

    if (item.kind === "erase") {
      operations.push({
        kind: "erase",
        page,
        x: parseNonNegativeCoordinate(item.x),
        y: parseNonNegativeCoordinate(item.y),
        width: parsePositiveCoordinate(item.width),
        height: parsePositiveCoordinate(item.height),
      });
      continue;
    }

    if (item.kind === "rectangle") {
      const style = item.style ?? "fill";
      if (style !== "fill" && style !== "highlight") {
        throw invalidOptions();
      }

      operations.push({
        kind: "rectangle",
        page,
        x: parseNonNegativeCoordinate(item.x),
        y: parseNonNegativeCoordinate(item.y),
        width: parsePositiveCoordinate(item.width),
        height: parsePositiveCoordinate(item.height),
        style,
      });
      continue;
    }

    if (item.kind === "image") {
      operations.push({
        kind: "image",
        page,
        x: parseNonNegativeCoordinate(item.x),
        y: parseNonNegativeCoordinate(item.y),
        width: parsePositiveCoordinate(item.width),
        height: parsePositiveCoordinate(item.height),
      });
      continue;
    }

    throw invalidOptions();
  }

  return operations;
}

function parseRedactRegions(value: unknown): RedactPdfOptions["regions"] {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > MAX_REDACT_REGIONS
  ) {
    throw invalidOptions();
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      throw invalidOptions();
    }

    const page = assertOptionalPositiveInteger(item.page);
    if (page === undefined) {
      throw invalidOptions();
    }

    return {
      page,
      x: parseNonNegativeCoordinate(item.x),
      y: parseNonNegativeCoordinate(item.y),
      width: parsePositiveCoordinate(item.width),
      height: parsePositiveCoordinate(item.height),
    };
  });
}

function parseFormFields(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    throw invalidOptions();
  }

  const entries = Object.entries(value);

  if (entries.length < 1 || entries.length > MAX_FORM_FIELDS) {
    throw invalidOptions();
  }

  const fields: Record<string, string> = {};

  for (const [key, fieldValue] of entries) {
    if (key.trim().length === 0 || typeof fieldValue !== "string") {
      throw invalidOptions();
    }

    fields[key] = fieldValue.slice(0, 2_000);
  }

  return fields;
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

function parseOrganizeOrder(value: unknown): number[] {
  if (!Array.isArray(value) || value.length < 1) {
    throw invalidOptions();
  }

  const pages: number[] = [];

  for (const item of value) {
    if (!isPositiveInteger(item)) {
      throw invalidOptions();
    }

    pages.push(item);
  }

  return pages;
}

function isOrganizeRotation(value: unknown): value is OrganizeRotation {
  return ORGANIZE_ROTATIONS.some((rotation) => rotation === value);
}

function parseOrganizeRotations(
  value: unknown,
  orderLength: number,
): OrganizeRotation[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.length !== orderLength) {
    throw invalidOptions();
  }

  const rotations: OrganizeRotation[] = [];

  for (const item of value) {
    if (!isOrganizeRotation(item)) {
      throw invalidOptions();
    }

    rotations.push(item);
  }

  if (rotations.every((rotation) => rotation === 0)) {
    return undefined;
  }

  return rotations;
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

function isAiSummarizerOutputMode(
  value: unknown,
): value is AiSummarizerOutputMode {
  return AI_SUMMARIZER_OUTPUT_MODES.some((mode) => mode === value);
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

function resolveAiSummarizerOutputMode(
  value: unknown,
  targetFormat: FileFormat | undefined,
): AiSummarizerOutputMode {
  if (value === undefined) {
    if (targetFormat === "md") {
      return "md";
    }

    return "txt";
  }

  if (!isAiSummarizerOutputMode(value)) {
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
    case "extract-pages": {
      assertAllowedKeys(record, ["type", "ranges", "pages"]);
      const ranges = parseRanges(record.ranges);
      const pages =
        record.pages === undefined ? undefined : parsePageList(record.pages, 1);

      return {
        type,
        ...(ranges === undefined ? {} : { ranges }),
        ...(pages === undefined ? {} : { pages }),
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
    case "organize-pdf": {
      assertAllowedKeys(record, ["type", "order", "rotations"]);
      const order = parseOrganizeOrder(record.order);
      const rotations = parseOrganizeRotations(record.rotations, order.length);
      return {
        type,
        order,
        ...(rotations === undefined ? {} : { rotations }),
      };
    }
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
    case "pdf-to-pdfa": {
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
    case "edit-pdf": {
      assertAllowedKeys(record, ["type", "operations", "additionalFileIds"]);
      const additionalFileIds = parseOptionalAdditionalFileIds(
        record.additionalFileIds,
        1,
      );

      return {
        type,
        operations: parseEditOperations(record.operations),
        ...(additionalFileIds === undefined ? {} : { additionalFileIds }),
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
    case "sign-pdf": {
      assertAllowedKeys(record, [
        "type",
        "page",
        "x",
        "y",
        "width",
        "height",
        "text",
        "additionalFileIds",
      ]);
      const page = assertOptionalPositiveInteger(record.page);
      if (page === undefined) {
        throw invalidOptions();
      }

      const additionalFileIds = parseOptionalAdditionalFileIds(
        record.additionalFileIds,
        1,
      );
      const text =
        record.text === undefined ? undefined : parseWatermarkText(record.text);

      if (additionalFileIds === undefined && text === undefined) {
        throw invalidOptions();
      }

      return {
        type,
        page,
        x: parseNonNegativeCoordinate(record.x),
        y: parseNonNegativeCoordinate(record.y),
        width: parsePositiveCoordinate(record.width),
        height: parsePositiveCoordinate(record.height),
        ...(text === undefined ? {} : { text }),
        ...(additionalFileIds === undefined ? {} : { additionalFileIds }),
      };
    }
    case "redact-pdf": {
      assertAllowedKeys(record, ["type", "regions"]);
      return {
        type,
        regions: parseRedactRegions(record.regions),
      };
    }
    case "compare-pdf": {
      assertAllowedKeys(record, ["type", "additionalFileIds"]);
      const additionalFileIds = parseAdditionalFileIds(
        record.additionalFileIds,
        1,
      );

      if (additionalFileIds.length !== 1) {
        throw invalidOptions();
      }

      return { type, additionalFileIds };
    }
    case "pdf-forms": {
      assertAllowedKeys(record, ["type", "fields", "flatten"]);
      const flatten =
        record.flatten === undefined
          ? undefined
          : record.flatten === true
            ? true
            : record.flatten === false
              ? false
              : (() => {
                  throw invalidOptions();
                })();

      return {
        type,
        fields: parseFormFields(record.fields),
        ...(flatten === undefined ? {} : { flatten }),
      };
    }
    case "scan-to-pdf": {
      assertAllowedKeys(record, ["type", "additionalFileIds"]);
      const additionalFileIds = parseOptionalAdditionalFileIds(
        record.additionalFileIds,
        MAX_SCAN_ADDITIONAL_FILES,
      );

      return {
        type,
        ...(additionalFileIds === undefined ? {} : { additionalFileIds }),
      };
    }
    case "pdf-extract":
    case "pdf-to-markdown": {
      assertAllowedKeys(record, ["type"]);
      return { type };
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
    case "pdf-to-txt": {
      assertAllowedKeys(record, ["type"]);
      return { type };
    }
    case "jpg-to-pdf":
    case "png-to-pdf": {
      assertAllowedKeys(record, ["type", "additionalFileIds"]);
      const additionalFileIds = parseOptionalAdditionalFileIds(
        record.additionalFileIds,
        MAX_IMAGE_ADDITIONAL_FILES,
      );

      return {
        type,
        ...(additionalFileIds === undefined ? {} : { additionalFileIds }),
      };
    }
    case "pdf-to-word-ocr":
    case "pdf-to-excel-ocr": {
      assertAllowedKeys(record, ["type", "language"]);
      return {
        type,
        language: parseLanguage(record.language ?? "eng"),
      };
    }
    case "ai-summarizer": {
      assertAllowedKeys(record, ["type", "language", "outputMode"]);
      return {
        type,
        language: parseLanguage(record.language ?? "eng"),
        outputMode: resolveAiSummarizerOutputMode(
          record.outputMode,
          context.targetFormat,
        ),
      };
    }
    case "translate-pdf": {
      assertAllowedKeys(record, ["type", "targetLanguage", "sourceLanguage"]);
      const sourceLanguage =
        record.sourceLanguage === undefined
          ? undefined
          : parseLanguage(record.sourceLanguage);

      return {
        type,
        targetLanguage: parseLanguage(record.targetLanguage),
        ...(sourceLanguage === undefined ? {} : { sourceLanguage }),
      };
    }
  }
}
