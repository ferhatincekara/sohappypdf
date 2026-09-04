import {
  clampFontSizePt,
  resolvePdfFont,
  sanitizeCssColor,
} from "./pdf-font-style.js";
import { decodeXmlEntities } from "./pdf-layout.js";

export type HtmlXmlFont = {
  id: string;
  fontFamily: string;
  fontSizePt: number;
  color: string;
  bold: boolean;
  italic: boolean;
};

export type HtmlXmlRun = {
  text: string;
  fontFamily: string;
  fontSizePt: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

export type HtmlXmlText = {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  fontId: string;
  runs: HtmlXmlRun[];
};

export type HtmlXmlImage = {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  src: string;
};

export type HtmlXmlPage = {
  width: number;
  height: number;
  fonts: ReadonlyMap<string, HtmlXmlFont>;
  texts: HtmlXmlText[];
  images: HtmlXmlImage[];
};

const PAGE_PATTERN = /<page\b([^>]*)>([\s\S]*?)<\/page>/g;
const FONTSPEC_PATTERN = /<fontspec\b([^>]*)\/?>/g;
const IMAGE_PATTERN = /<image\b([^>]*)\/?>/g;
const TEXT_PATTERN = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
const MARKUP_TOKEN = /<\/?(?:b|i|em|strong|u|a)(?:\s[^>]*)?>|[^<]+/gi;
const IMAGE_NAME = /^[A-Za-z0-9._-]+$/;

function readNumberAttribute(attributes: string, name: string): number {
  const match = attributes.match(new RegExp(`\\b${name}="([^"]+)"`));
  const value = Number.parseFloat(match?.[1] ?? "");
  return Number.isFinite(value) ? value : 0;
}

function readStringAttribute(attributes: string, name: string): string {
  const match = attributes.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match?.[1] ?? "";
}

function normalizeMark(tag: string): "b" | "i" | "u" | "a" {
  const lower = tag.toLowerCase();

  if (lower === "strong") {
    return "b";
  }

  if (lower === "em") {
    return "i";
  }

  if (lower === "b" || lower === "i" || lower === "u" || lower === "a") {
    return lower;
  }

  return "a";
}

function parseRichRuns(inner: string, font: HtmlXmlFont): HtmlXmlRun[] {
  const runs: HtmlXmlRun[] = [];
  const stack: Array<"b" | "i" | "u"> = [];
  const tokens = inner.match(MARKUP_TOKEN) ?? [];

  for (const token of tokens) {
    const open = token.match(/^<(b|i|em|strong|u|a)\b/i);
    const close = token.match(/^<\/(b|i|em|strong|u|a)>/i);

    if (open?.[1] !== undefined) {
      const mark = normalizeMark(open[1]);

      if (mark !== "a") {
        stack.push(mark);
      }

      continue;
    }

    if (close?.[1] !== undefined) {
      const mark = normalizeMark(close[1]);

      if (mark !== "a") {
        const index = stack.lastIndexOf(mark);

        if (index >= 0) {
          stack.splice(index, 1);
        }
      }

      continue;
    }

    const text = decodeXmlEntities(token);

    if (text.length === 0) {
      continue;
    }

    runs.push({
      text,
      fontFamily: font.fontFamily,
      fontSizePt: font.fontSizePt,
      color: font.color,
      bold: font.bold || stack.includes("b"),
      italic: font.italic || stack.includes("i"),
      underline: stack.includes("u"),
    });
  }

  return runs;
}

function parseFont(attributes: string): HtmlXmlFont | undefined {
  const id = readStringAttribute(attributes, "id");

  if (id.length === 0) {
    return undefined;
  }

  const resolved = resolvePdfFont(readStringAttribute(attributes, "family"));

  return {
    id,
    fontFamily: resolved.fontFamily,
    fontSizePt: clampFontSizePt(readNumberAttribute(attributes, "size")),
    color: sanitizeCssColor(readStringAttribute(attributes, "color")),
    bold: resolved.bold,
    italic: resolved.italic,
  };
}

export function safeHtmlXmlImageSrc(src: string): string | undefined {
  if (src.includes("..") || src.includes("/") || src.includes("\\")) {
    return undefined;
  }

  if (!IMAGE_NAME.test(src) || src.startsWith(".")) {
    return undefined;
  }

  return src;
}

function parseImage(attributes: string): HtmlXmlImage | undefined {
  const src = safeHtmlXmlImageSrc(readStringAttribute(attributes, "src"));

  if (src === undefined) {
    return undefined;
  }

  const left = readNumberAttribute(attributes, "left");
  const top = readNumberAttribute(attributes, "top");
  const width = readNumberAttribute(attributes, "width");
  const height = readNumberAttribute(attributes, "height");

  return {
    xMin: left,
    yMin: top,
    xMax: left + width,
    yMax: top + height,
    src,
  };
}

const FALLBACK_FONT: HtmlXmlFont = {
  id: "0",
  fontFamily: "Arial",
  fontSizePt: 11,
  color: "#000000",
  bold: false,
  italic: false,
};

function parsePageFonts(xml: string): Map<string, HtmlXmlFont> {
  const fonts = new Map<string, HtmlXmlFont>();

  for (const match of xml.matchAll(FONTSPEC_PATTERN)) {
    const font = parseFont(match[1] ?? "");

    if (font !== undefined) {
      fonts.set(font.id, font);
    }
  }

  return fonts;
}

function parseTexts(
  xml: string,
  fonts: ReadonlyMap<string, HtmlXmlFont>,
): HtmlXmlText[] {
  const texts: HtmlXmlText[] = [];

  for (const match of xml.matchAll(TEXT_PATTERN)) {
    const attributes = match[1] ?? "";
    const font =
      fonts.get(readStringAttribute(attributes, "font")) ?? FALLBACK_FONT;
    const runs = parseRichRuns(match[2] ?? "", font).filter(
      (run) => run.text.trim().length > 0 || run.text.includes(" "),
    );

    if (runs.length === 0) {
      continue;
    }

    const left = readNumberAttribute(attributes, "left");
    const top = readNumberAttribute(attributes, "top");
    const width = readNumberAttribute(attributes, "width");
    const height = readNumberAttribute(attributes, "height");

    texts.push({
      xMin: left,
      yMin: top,
      xMax: left + width,
      yMax: top + height,
      fontId: font.id,
      runs,
    });
  }

  return texts;
}

export function parsePdftohtmlXml(xml: string): HtmlXmlPage[] {
  return [...xml.matchAll(PAGE_PATTERN)].map((match) => {
    const attributes = match[1] ?? "";
    const body = match[2] ?? "";
    const fonts = parsePageFonts(body);

    return {
      width: readNumberAttribute(attributes, "width"),
      height: readNumberAttribute(attributes, "height"),
      fonts,
      texts: parseTexts(body, fonts),
      images: [...body.matchAll(IMAGE_PATTERN)].flatMap((imageMatch) => {
        const image = parseImage(imageMatch[1] ?? "");
        return image === undefined ? [] : [image];
      }),
    };
  });
}

export function countHtmlXmlTextChars(pages: readonly HtmlXmlPage[]): number {
  return pages.reduce(
    (total, page) =>
      total +
      page.texts.reduce(
        (pageTotal, text) =>
          pageTotal +
          text.runs.reduce((runTotal, run) => runTotal + run.text.length, 0),
        0,
      ),
    0,
  );
}
