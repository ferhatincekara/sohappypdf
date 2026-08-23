export type LayoutBox = {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
};

export type LayoutWord = LayoutBox & {
  text: string;
};

export type LayoutLine = LayoutBox & {
  words: LayoutWord[];
};

export type LayoutBlock = LayoutBox & {
  lines: LayoutLine[];
};

export type LayoutPage = {
  width: number;
  height: number;
  blocks: LayoutBlock[];
};

const TAG_PATTERN = (tag: string) =>
  new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, "g");

function readAttribute(attributes: string, name: string): number {
  const match = attributes.match(new RegExp(`\\b${name}="([^"]+)"`));
  const value = Number.parseFloat(match?.[1] ?? "");

  if (!Number.isFinite(value)) {
    return 0;
  }

  return value;
}

function readBox(attributes: string): LayoutBox {
  return {
    xMin: readAttribute(attributes, "xMin"),
    yMin: readAttribute(attributes, "yMin"),
    xMax: readAttribute(attributes, "xMax"),
    yMax: readAttribute(attributes, "yMax"),
  };
}

function fromCodePoint(code: number): string {
  if (!Number.isInteger(code) || code < 1 || code > 0x10ffff) {
    return "";
  }

  return String.fromCodePoint(code);
}

export function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      fromCodePoint(Number.parseInt(dec, 10)),
    )
    .replace(/&amp;/g, "&");
}

function parseWords(xml: string): LayoutWord[] {
  return [...xml.matchAll(TAG_PATTERN("word"))].map((match) => ({
    ...readBox(match[1] ?? ""),
    text: decodeXmlEntities(match[2] ?? "").trim(),
  }));
}

function parseLines(xml: string): LayoutLine[] {
  return [...xml.matchAll(TAG_PATTERN("line"))].map((match) => {
    const words = parseWords(match[2] ?? "").filter(
      (word) => word.text.length > 0,
    );

    return {
      ...readBox(match[1] ?? ""),
      words,
    };
  });
}

function parseBlocks(xml: string): LayoutBlock[] {
  return [...xml.matchAll(TAG_PATTERN("block"))].map((match) => ({
    ...readBox(match[1] ?? ""),
    lines: parseLines(match[2] ?? ""),
  }));
}

export function parsePdfLayout(xml: string): LayoutPage[] {
  return [...xml.matchAll(TAG_PATTERN("page"))].map((match) => ({
    width: readAttribute(match[1] ?? "", "width"),
    height: readAttribute(match[1] ?? "", "height"),
    blocks: parseBlocks(match[2] ?? "").filter((block) =>
      block.lines.some((line) => line.words.length > 0),
    ),
  }));
}

export function countLayoutWords(pages: readonly LayoutPage[]): number {
  return pages.reduce(
    (pageTotal, page) =>
      pageTotal +
      page.blocks.reduce(
        (blockTotal, block) =>
          blockTotal +
          block.lines.reduce(
            (lineTotal, line) => lineTotal + line.words.length,
            0,
          ),
        0,
      ),
    0,
  );
}

export function blockText(block: LayoutBlock): string {
  return block.lines
    .map((line) => line.words.map((word) => word.text).join(" "))
    .join(" ")
    .trim();
}
