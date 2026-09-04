import { createTextObject } from "@/features/pdf-document-editor/lib/create-editor-object";
import { pdfRectToEditor } from "@/features/pdf-document-editor/lib/page-coordinates";
import type { EditorTextObject } from "@/features/pdf-document-editor/types/editor-object";

export type PdfTextSpan = {
  str: string;
  transform: readonly number[];
  width: number;
  height: number;
  fontName: string;
};

type LineSpan = {
  x: number;
  baseline: number;
  width: number;
  fontSize: number;
  text: string;
  fontName: string;
};

const LINE_BASELINE_RATIO = 0.35;
const SPACE_GAP_RATIO = 0.14;
const MAX_LINES_PER_DOCUMENT = 400;

export function resolveEditorFontFamily(fontName: string): string {
  const compact = fontName.replace(/[\s_+-]+/g, "").toLowerCase();
  const bold = /bold|black|heavy/.test(compact);

  if (/times|serif|georgia|garamond|palatino|cambria/.test(compact)) {
    return bold ? "Times New Roman Bold" : "Times New Roman";
  }

  if (/courier|mono|consolas/.test(compact)) {
    return bold ? "Courier New Bold" : "Courier New";
  }

  return bold ? "Arial Bold" : "Arial";
}

function fontSizeOf(span: PdfTextSpan): number {
  const scaleX = span.transform[0] ?? 0;
  const scaleY = span.transform[1] ?? 0;
  const fromTransform = Math.hypot(scaleX, scaleY);

  if (fromTransform > 1) {
    return fromTransform;
  }

  if (span.height > 1) {
    return span.height;
  }

  return 12;
}

function toLineSpan(span: PdfTextSpan): LineSpan | undefined {
  const text = span.str.replace(/\s+/g, " ");

  if (text.trim().length === 0 || span.transform.length < 6) {
    return undefined;
  }

  const fontSize = fontSizeOf(span);
  const width =
    span.width > 0 ? span.width : Math.max(fontSize * text.length * 0.45, 4);

  return {
    x: span.transform[4] ?? 0,
    baseline: span.transform[5] ?? 0,
    width,
    fontSize,
    text,
    fontName: span.fontName,
  };
}

function sameLine(left: LineSpan, right: LineSpan): boolean {
  return (
    Math.abs(left.baseline - right.baseline) <=
    Math.max(left.fontSize, right.fontSize) * LINE_BASELINE_RATIO
  );
}

function joinLineText(spans: readonly LineSpan[]): string {
  let text = "";

  for (const [index, span] of spans.entries()) {
    const previous = spans[index - 1];

    if (previous === undefined) {
      text = span.text;
      continue;
    }

    const gap = span.x - (previous.x + previous.width);
    const needsSpace =
      gap > Math.max(previous.fontSize, span.fontSize) * SPACE_GAP_RATIO &&
      !text.endsWith(" ") &&
      !span.text.startsWith(" ");
    text += needsSpace ? ` ${span.text}` : span.text;
  }

  return text.replace(/\s+/g, " ").trim();
}

export function groupPdfTextLines(
  spans: readonly PdfTextSpan[],
  page: number,
  pageHeight: number,
): EditorTextObject[] {
  const parsed = spans
    .flatMap((span) => {
      const next = toLineSpan(span);
      return next === undefined ? [] : [next];
    })
    .sort((left, right) => {
      const top = right.baseline - left.baseline;
      return top === 0 ? left.x - right.x : top;
    });

  const lines: LineSpan[][] = [];

  for (const span of parsed) {
    const current = lines[lines.length - 1];

    if (current !== undefined && sameLine(current[0] ?? span, span)) {
      current.push(span);
      current.sort((left, right) => left.x - right.x);
      continue;
    }

    lines.push([span]);
  }

  return lines.flatMap((line) => {
    const text = joinLineText(line);
    const first = line[0];

    if (text.length === 0 || first === undefined) {
      return [];
    }

    const x = Math.min(...line.map((span) => span.x));
    const right = Math.max(...line.map((span) => span.x + span.width));
    const fontSize = Math.max(...line.map((span) => span.fontSize));
    const baseline = Math.min(...line.map((span) => span.baseline));
    const box = pdfRectToEditor({
      x,
      y: baseline,
      width: Math.max(right - x, fontSize),
      height: fontSize,
      pageHeight,
    });

    return [
      createTextObject({
        page,
        x: box.x,
        y: box.y,
        width: box.width,
        height: Math.max(box.height, fontSize),
        text,
        fontSize: Math.round(fontSize * 10) / 10,
        fontFamily: resolveEditorFontFamily(first.fontName),
        source: "original",
      }),
    ];
  });
}

export async function extractPdfTextLines(document: {
  numPages: number;
  getPage: (page: number) => Promise<{
    getViewport: (input: { scale: number }) => { height: number };
    getTextContent: () => Promise<{ items: readonly unknown[] }>;
  }>;
}): Promise<EditorTextObject[]> {
  const objects: EditorTextObject[] = [];

  for (let page = 1; page <= document.numPages; page += 1) {
    const pdfPage = await document.getPage(page);
    const viewport = pdfPage.getViewport({ scale: 1 });
    const content = await pdfPage.getTextContent();
    const spans = content.items.flatMap((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("str" in item) ||
        !("transform" in item)
      ) {
        return [];
      }

      const record = item as {
        str: unknown;
        transform: unknown;
        width?: unknown;
        height?: unknown;
        fontName?: unknown;
      };

      if (
        typeof record.str !== "string" ||
        !Array.isArray(record.transform) ||
        record.transform.some((value) => typeof value !== "number")
      ) {
        return [];
      }

      return [
        {
          str: record.str,
          transform: record.transform as number[],
          width: typeof record.width === "number" ? record.width : 0,
          height: typeof record.height === "number" ? record.height : 0,
          fontName:
            typeof record.fontName === "string" ? record.fontName : "Helvetica",
        } satisfies PdfTextSpan,
      ];
    });

    objects.push(...groupPdfTextLines(spans, page, viewport.height));

    if (objects.length >= MAX_LINES_PER_DOCUMENT) {
      return objects.slice(0, MAX_LINES_PER_DOCUMENT);
    }
  }

  return objects;
}
