export type ExtraFilesKind = "none" | "required" | "optional";

export type ToolOptionField = {
  name: string;
  required: boolean;
  spec: string;
};

export type ToolGuideNoteId =
  | "pagesOneIndexed"
  | "extraFilesTopLevel"
  | "explicitType"
  | "rangesInclusive"
  | "ocrLanguage"
  | "protectSecret"
  | "signVisualOnly"
  | "compareSecondFile";

export type PublicApiToolGuide = {
  extraFiles: ExtraFilesKind;
  requiresExplicitType: boolean;
  fields: readonly ToolOptionField[];
  exampleOptions?: Record<string, unknown>;
  exampleAdditionalFileIds?: readonly string[];
  noteIds: readonly ToolGuideNoteId[];
};

const DEFAULT_GUIDE: PublicApiToolGuide = {
  extraFiles: "none",
  requiresExplicitType: false,
  fields: [],
  noteIds: [],
};

const GUIDES: Record<string, PublicApiToolGuide> = {
  "merge-pdf": {
    extraFiles: "required",
    requiresExplicitType: true,
    fields: [],
    exampleAdditionalFileIds: ["FILE_ID_2"],
    noteIds: ["extraFilesTopLevel", "explicitType"],
  },
  "split-pdf": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [
      {
        name: "ranges",
        required: false,
        spec: "[{ start, end }, ...] 1-based",
      },
    ],
    exampleOptions: { ranges: [{ start: 1, end: 2 }] },
    noteIds: ["pagesOneIndexed", "rangesInclusive"],
  },
  "extract-pages": {
    extraFiles: "none",
    requiresExplicitType: true,
    fields: [
      {
        name: "ranges",
        required: false,
        spec: "[{ start, end }, ...] 1-based",
      },
    ],
    exampleOptions: { ranges: [{ start: 1, end: 3 }] },
    noteIds: ["pagesOneIndexed", "rangesInclusive", "explicitType"],
  },
  "organize-pdf": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [
      { name: "order", required: true, spec: "number[] page order" },
      {
        name: "rotations",
        required: false,
        spec: "0 | 90 | 180 | 270 per page",
      },
    ],
    exampleOptions: { order: [2, 1, 3] },
    noteIds: ["pagesOneIndexed"],
  },
  "remove-pages": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [{ name: "pages", required: true, spec: "number[] 1-based" }],
    exampleOptions: { pages: [2, 4] },
    noteIds: ["pagesOneIndexed"],
  },
  "reorder-pages": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [{ name: "order", required: true, spec: "number[] 1-based" }],
    exampleOptions: { order: [3, 1, 2] },
    noteIds: ["pagesOneIndexed"],
  },
  "rotate-pdf": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [
      { name: "degrees", required: true, spec: "90 | 180 | 270" },
      { name: "pages", required: false, spec: "number[] 1-based" },
    ],
    exampleOptions: { degrees: 90 },
    noteIds: ["pagesOneIndexed"],
  },
  "crop-pdf": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [
      { name: "marginTop", required: false, spec: "number, default 0" },
      { name: "marginRight", required: false, spec: "number, default 0" },
      { name: "marginBottom", required: false, spec: "number, default 0" },
      { name: "marginLeft", required: false, spec: "number, default 0" },
    ],
    exampleOptions: {
      marginTop: 24,
      marginRight: 24,
      marginBottom: 24,
      marginLeft: 24,
    },
    noteIds: [],
  },
  "compress-pdf": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [{ name: "level", required: false, spec: "low | medium | high" }],
    exampleOptions: { level: "medium" },
    noteIds: [],
  },
  "repair-pdf": DEFAULT_GUIDE,
  "pdf-to-pdfa": DEFAULT_GUIDE,
  "pdf-to-word": DEFAULT_GUIDE,
  "pdf-to-word-ocr": {
    extraFiles: "none",
    requiresExplicitType: true,
    fields: [{ name: "language", required: true, spec: "OCR language code" }],
    exampleOptions: { language: "eng" },
    noteIds: ["explicitType", "ocrLanguage"],
  },
  "pdf-to-powerpoint": DEFAULT_GUIDE,
  "pdf-to-excel": DEFAULT_GUIDE,
  "pdf-to-excel-ocr": {
    extraFiles: "none",
    requiresExplicitType: true,
    fields: [{ name: "language", required: true, spec: "OCR language code" }],
    exampleOptions: { language: "eng" },
    noteIds: ["explicitType", "ocrLanguage"],
  },
  "pdf-to-jpg": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [
      { name: "page", required: false, spec: "1-based page number" },
      { name: "quality", required: false, spec: "1-100" },
      { name: "dpi", required: false, spec: "72-600" },
    ],
    exampleOptions: { page: 1, dpi: 150 },
    noteIds: ["pagesOneIndexed"],
  },
  "pdf-to-png": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [
      { name: "page", required: false, spec: "1-based page number" },
      { name: "quality", required: false, spec: "1-100" },
      { name: "dpi", required: false, spec: "72-600" },
    ],
    exampleOptions: { page: 1, dpi: 150 },
    noteIds: ["pagesOneIndexed"],
  },
  "pdf-to-txt": DEFAULT_GUIDE,
  "word-to-pdf": DEFAULT_GUIDE,
  "powerpoint-to-pdf": DEFAULT_GUIDE,
  "excel-to-pdf": DEFAULT_GUIDE,
  "jpg-to-pdf": DEFAULT_GUIDE,
  "png-to-pdf": DEFAULT_GUIDE,
  "office-to-pdf": DEFAULT_GUIDE,
  "edit-pdf": {
    extraFiles: "optional",
    requiresExplicitType: false,
    fields: [
      {
        name: "operations",
        required: true,
        spec: "text | rectangle | image overlays",
      },
    ],
    exampleOptions: {
      operations: [
        {
          kind: "text",
          page: 1,
          x: 72,
          y: 720,
          text: "CONFIDENTIAL",
          size: 14,
        },
      ],
    },
    noteIds: ["pagesOneIndexed", "extraFilesTopLevel"],
  },
  "watermark-pdf": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [
      { name: "text", required: true, spec: "string" },
      { name: "opacity", required: false, spec: "0-1" },
    ],
    exampleOptions: { text: "DRAFT", opacity: 0.25 },
    noteIds: [],
  },
  "page-numbers-pdf": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [{ name: "startAt", required: false, spec: "number, default 1" }],
    exampleOptions: { startAt: 1 },
    noteIds: [],
  },
  "protect-pdf": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [{ name: "password", required: true, spec: "string" }],
    exampleOptions: { password: "YOUR_PASSWORD" },
    noteIds: ["protectSecret"],
  },
  "unlock-pdf": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [{ name: "password", required: true, spec: "string" }],
    exampleOptions: { password: "YOUR_PASSWORD" },
    noteIds: ["protectSecret"],
  },
  "sign-pdf": {
    extraFiles: "optional",
    requiresExplicitType: false,
    fields: [
      { name: "page", required: true, spec: "1-based page number" },
      { name: "x", required: true, spec: "number" },
      { name: "y", required: true, spec: "number" },
      { name: "width", required: true, spec: "number" },
      { name: "height", required: true, spec: "number" },
      { name: "text", required: false, spec: "fallback stamp text" },
    ],
    exampleOptions: {
      page: 1,
      x: 72,
      y: 72,
      width: 160,
      height: 64,
      text: "Signed",
    },
    noteIds: ["pagesOneIndexed", "signVisualOnly", "extraFilesTopLevel"],
  },
  "redact-pdf": {
    extraFiles: "none",
    requiresExplicitType: false,
    fields: [
      {
        name: "regions",
        required: true,
        spec: "[{ page, x, y, width, height }]",
      },
    ],
    exampleOptions: {
      regions: [{ page: 1, x: 72, y: 400, width: 200, height: 24 }],
    },
    noteIds: ["pagesOneIndexed"],
  },
  "compare-pdf": {
    extraFiles: "required",
    requiresExplicitType: true,
    fields: [],
    exampleAdditionalFileIds: ["FILE_ID_2"],
    noteIds: ["extraFilesTopLevel", "explicitType", "compareSecondFile"],
  },
  "scan-to-pdf": {
    extraFiles: "optional",
    requiresExplicitType: true,
    fields: [],
    exampleAdditionalFileIds: ["FILE_ID_2"],
    noteIds: ["extraFilesTopLevel", "explicitType"],
  },
  "pdf-extract": {
    extraFiles: "none",
    requiresExplicitType: true,
    fields: [],
    noteIds: ["explicitType"],
  },
  "pdf-to-markdown": DEFAULT_GUIDE,
  "ocr-pdf": {
    extraFiles: "none",
    requiresExplicitType: true,
    fields: [
      { name: "language", required: true, spec: "OCR language code" },
      { name: "outputMode", required: true, spec: "pdf | txt" },
    ],
    exampleOptions: { language: "eng", outputMode: "pdf" },
    noteIds: ["explicitType", "ocrLanguage"],
  },
};

export function getPublicApiToolGuide(toolId: string): PublicApiToolGuide {
  return GUIDES[toolId] ?? DEFAULT_GUIDE;
}

export function listGuidedToolIds(): readonly string[] {
  return Object.keys(GUIDES);
}

export function buildConversionExampleBody(input: {
  toolId: string;
  targetFormat: string;
}): Record<string, unknown> {
  const guide = getPublicApiToolGuide(input.toolId);
  const body: Record<string, unknown> = {
    sourceFileId: "FILE_ID",
    targetFormat: input.targetFormat,
    type: input.toolId,
  };

  if (guide.exampleAdditionalFileIds !== undefined) {
    body.additionalFileIds = [...guide.exampleAdditionalFileIds];
  }

  if (guide.exampleOptions !== undefined) {
    body.options = guide.exampleOptions;
  }

  return body;
}
