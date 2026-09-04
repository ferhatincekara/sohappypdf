import type {
  HtmlXmlImage,
  HtmlXmlPage,
  HtmlXmlRun,
  HtmlXmlText,
} from "./pdftohtml-xml.js";

export type WordAlign = "left" | "center" | "right";

export type WordParagraph = {
  kind: "paragraph" | "heading";
  headingLevel?: 1 | 2 | 3;
  align: WordAlign;
  runs: HtmlXmlRun[];
};

export type WordList = {
  kind: "list";
  ordered: boolean;
  items: HtmlXmlRun[][];
};

export type WordTableCell = {
  runs: HtmlXmlRun[];
  header: boolean;
};

export type WordTable = {
  kind: "table";
  rows: WordTableCell[][];
};

export type WordImage = {
  kind: "image";
  src: string;
  widthPt: number;
  heightPt: number;
};

export type WordBlock = WordParagraph | WordList | WordTable | WordImage;

export type WordDocument = {
  pageWidthPt: number;
  pageHeightPt: number;
  blocks: WordBlock[];
};

type Line = {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  texts: HtmlXmlText[];
};

const ROW_OVERLAP = 0.45;
const COLUMN_TOLERANCE = 14;
const LIST_PREFIX = /^(?:[•●○■□▪▫‣]|[-–—*])\s+|^\d{1,3}[.)]?\s+\S/;
const LIST_NUMBER_ONLY = /^\d{1,3}$/;

function median(values: readonly number[], fallback: number): number {
  if (values.length === 0) {
    return fallback;
  }

  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? fallback;
}

function textContent(text: HtmlXmlText): string {
  return text.runs
    .map((run) => run.text)
    .join("")
    .trim();
}

function runsText(runs: readonly HtmlXmlRun[]): string {
  return runs
    .map((run) => run.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function dominantSize(runs: readonly HtmlXmlRun[]): number {
  return median(
    runs.map((run) => run.fontSizePt),
    11,
  );
}

function allBold(runs: readonly HtmlXmlRun[]): boolean {
  const visible = runs.filter((run) => run.text.trim().length > 0);
  return visible.length > 0 && visible.every((run) => run.bold);
}

function verticalOverlap(left: HtmlXmlText, right: HtmlXmlText): number {
  return Math.max(
    0,
    Math.min(left.yMax, right.yMax) - Math.max(left.yMin, right.yMin),
  );
}

function sameLine(left: HtmlXmlText, right: HtmlXmlText): boolean {
  const overlap = verticalOverlap(left, right);
  const minHeight = Math.min(left.yMax - left.yMin, right.yMax - right.yMin);

  if (minHeight <= 0) {
    return Math.abs(left.yMin - right.yMin) < 6;
  }

  return overlap / minHeight >= ROW_OVERLAP;
}

function clusterLines(texts: readonly HtmlXmlText[]): Line[] {
  const sorted = [...texts].sort((left, right) => {
    const top = left.yMin - right.yMin;
    return top === 0 ? left.xMin - right.xMin : top;
  });
  const lines: Line[] = [];

  for (const text of sorted) {
    const current = lines[lines.length - 1];

    if (current !== undefined && sameLine(current.texts[0] ?? text, text)) {
      current.texts.push(text);
      current.texts.sort((left, right) => left.xMin - right.xMin);
      current.xMin = Math.min(current.xMin, text.xMin);
      current.yMin = Math.min(current.yMin, text.yMin);
      current.xMax = Math.max(current.xMax, text.xMax);
      current.yMax = Math.max(current.yMax, text.yMax);
      continue;
    }

    lines.push({
      xMin: text.xMin,
      yMin: text.yMin,
      xMax: text.xMax,
      yMax: text.yMax,
      texts: [text],
    });
  }

  return lines;
}

function gapThreshold(texts: readonly HtmlXmlText[]): number {
  const small: number[] = [];
  const large: number[] = [];

  for (const line of clusterLines(texts)) {
    for (let index = 1; index < line.texts.length; index += 1) {
      const previous = line.texts[index - 1];
      const current = line.texts[index];

      if (previous === undefined || current === undefined) {
        continue;
      }

      const gap = current.xMin - previous.xMax;

      if (gap <= 0) {
        continue;
      }

      if (gap < 24) {
        small.push(gap);
      } else {
        large.push(gap);
      }
    }
  }

  if (small.length > 0 && large.length > 0) {
    return (median(small, 8) + median(large, 40)) / 2;
  }

  return Math.max(28, median(small, 8) * 3);
}

function splitLineCells(line: Line, threshold: number): HtmlXmlText[][] {
  const cells: HtmlXmlText[][] = [];

  for (const text of line.texts) {
    const current = cells[cells.length - 1];
    const previous = current?.[current.length - 1];

    if (
      current !== undefined &&
      previous !== undefined &&
      text.xMin - previous.xMax <= threshold
    ) {
      current.push(text);
      continue;
    }

    cells.push([text]);
  }

  return cells;
}

function flattenRuns(texts: readonly HtmlXmlText[]): HtmlXmlRun[] {
  const runs: HtmlXmlRun[] = [];

  for (const [index, text] of texts.entries()) {
    if (index > 0) {
      const previous = texts[index - 1];

      if (
        previous !== undefined &&
        text.xMin - previous.xMax > 1 &&
        !runsText(text.runs).startsWith(" ") &&
        !runsText(previous.runs).endsWith(" ")
      ) {
        const sample = text.runs[0] ?? previous.runs[0];

        if (sample !== undefined) {
          runs.push({ ...sample, text: " ", underline: false });
        }
      }
    }

    runs.push(...text.runs);
  }

  return runs;
}

function lineAlign(line: Line, pageWidth: number): WordAlign {
  const width = line.xMax - line.xMin;
  const center = (line.xMin + line.xMax) / 2;
  const pageCenter = pageWidth / 2;

  if (
    width < pageWidth * 0.55 &&
    Math.abs(center - pageCenter) <= pageWidth * 0.1
  ) {
    return "center";
  }

  if (pageWidth - line.xMax < 40 && line.xMin > pageWidth * 0.32) {
    return "right";
  }

  return "left";
}

function headingLevel(
  runs: readonly HtmlXmlRun[],
  bodySize: number,
): 1 | 2 | 3 | undefined {
  const size = dominantSize(runs);
  const text = runsText(runs);

  if (text.length === 0 || text.length > 90) {
    return undefined;
  }

  if (size >= bodySize * 1.75) {
    return 1;
  }

  if (size >= bodySize * 1.4) {
    return 2;
  }

  if (size >= bodySize * 1.18 && allBold(runs)) {
    return 3;
  }

  return undefined;
}

function listPrefix(
  text: string,
): { ordered: boolean; rest: string } | undefined {
  const bullet = text.match(/^(?:[•●○■□▪▫‣]|[-–—*])\s+(.*)$/);

  if (bullet?.[1] !== undefined) {
    return { ordered: false, rest: bullet[1] };
  }

  const numbered = text.match(/^(\d{1,3})[.)]\s+(.*)$/);

  if (numbered?.[2] !== undefined) {
    return { ordered: true, rest: numbered[2] };
  }

  const spaced = text.match(/^(\d{1,3})\s+(\S.*)$/);

  if (spaced?.[2] !== undefined) {
    return { ordered: true, rest: spaced[2] };
  }

  return undefined;
}

function isIsolatedListNumber(text: HtmlXmlText | undefined): boolean {
  if (text === undefined) {
    return false;
  }

  return (
    LIST_NUMBER_ONLY.test(textContent(text)) && text.xMax - text.xMin <= 24
  );
}

function isNumberedListLine(line: Line, _threshold: number): boolean {
  if (isIsolatedListNumber(line.texts[0]) && line.texts.length >= 2) {
    return true;
  }

  return LIST_PREFIX.test(runsText(flattenRuns(line.texts)));
}

function listItemRuns(line: Line, _threshold: number): HtmlXmlRun[] {
  if (isIsolatedListNumber(line.texts[0]) && line.texts.length >= 2) {
    return flattenRuns(line.texts.slice(1));
  }

  const combined = flattenRuns(line.texts);
  const text = runsText(combined);
  const prefix = listPrefix(text);

  if (prefix === undefined) {
    return combined;
  }

  const sample = combined[0];

  if (sample === undefined) {
    return combined;
  }

  return [{ ...sample, text: prefix.rest }];
}

function clusterColumns(values: readonly number[]): number[] {
  const columns: number[] = [];

  for (const value of [...values].sort((left, right) => left - right)) {
    const existing = columns.find(
      (column) => Math.abs(column - value) <= COLUMN_TOLERANCE,
    );

    if (existing === undefined) {
      columns.push(value);
    }
  }

  return columns;
}

function assignColumn(xMin: number, columns: readonly number[]): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const [index, column] of columns.entries()) {
    const distance = Math.abs(column - xMin);

    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }

  return best;
}

function isTableCandidate(
  lines: readonly Line[],
  start: number,
  threshold: number,
  bodySize: number,
): number {
  const first = lines[start];

  if (first === undefined || splitLineCells(first, threshold).length < 2) {
    return 0;
  }

  if (headingLevel(flattenRuns(first.texts), bodySize) !== undefined) {
    return 0;
  }

  const collected: Line[] = [];

  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index];

    if (line === undefined || isNumberedListLine(line, threshold)) {
      break;
    }

    const cells = splitLineCells(line, threshold);

    if (cells.length < 2) {
      break;
    }

    if (headingLevel(flattenRuns(line.texts), bodySize) !== undefined) {
      break;
    }

    collected.push(line);
  }

  if (collected.length < 2) {
    return 0;
  }

  const columns = clusterColumns(
    collected.flatMap((line) =>
      splitLineCells(line, threshold).map((cell) => cell[0]?.xMin ?? 0),
    ),
  );

  if (columns.length < 2) {
    return 0;
  }

  const aligned = collected.filter((line) => {
    const cells = splitLineCells(line, threshold);
    return cells.length >= 2 && cells.length <= columns.length + 1;
  });

  return aligned.length >= 2 ? aligned.length : 0;
}

function toTable(lines: readonly Line[], threshold: number): WordTable {
  const columns = clusterColumns(
    lines.flatMap((line) =>
      splitLineCells(line, threshold).map((cell) => cell[0]?.xMin ?? 0),
    ),
  );
  const rows = lines.map((line, rowIndex) => {
    const cells = Array.from({ length: columns.length }, () => {
      const empty: WordTableCell = { runs: [], header: false };
      return empty;
    });

    for (const cell of splitLineCells(line, threshold)) {
      const first = cell[0];

      if (first === undefined) {
        continue;
      }

      const index = assignColumn(first.xMin, columns);
      const current = cells[index];

      if (current === undefined) {
        continue;
      }

      const runs = flattenRuns(cell);
      current.runs =
        current.runs.length === 0
          ? runs
          : [...current.runs, { ...runs[0], text: " " }, ...runs].filter(
              (run): run is HtmlXmlRun => run !== undefined,
            );
      current.header = rowIndex === 0 && allBold(runs);
    }

    return cells;
  });

  if (
    rows[0]?.every((cell) => cell.header || runsText(cell.runs).length === 0)
  ) {
    for (const cell of rows[0]) {
      cell.header = true;
    }
  } else if (rows[0] !== undefined) {
    for (const cell of rows[0]) {
      cell.header = true;
    }
  }

  return { kind: "table", rows };
}

function canJoinParagraphs(
  previous: WordParagraph,
  next: WordParagraph,
  previousBottom: number,
  nextTop: number,
): boolean {
  if (previous.kind !== "paragraph" || next.kind !== "paragraph") {
    return false;
  }

  if (previous.align !== next.align) {
    return false;
  }

  const previousSize = dominantSize(previous.runs);
  const nextSize = dominantSize(next.runs);

  if (Math.abs(previousSize - nextSize) > 1.2) {
    return false;
  }

  const gap = nextTop - previousBottom;
  return gap >= 0 && gap <= previousSize * 1.45;
}

function splitColumns(page: HtmlXmlPage): HtmlXmlText[][] {
  if (page.texts.length < 12 || page.width <= 0) {
    return [page.texts];
  }

  const mid = page.width / 2;
  const left = page.texts.filter((text) => text.xMax < mid - 10);
  const right = page.texts.filter((text) => text.xMin > mid + 10);
  const spanning = page.texts.filter(
    (text) => !left.includes(text) && !right.includes(text),
  );

  if (left.length < 6 || right.length < 6) {
    return [page.texts];
  }

  if (spanning.length > page.texts.length * 0.25) {
    return [page.texts];
  }

  return [spanning, left, right].filter((group) => group.length > 0);
}

function placeImages(
  images: readonly HtmlXmlImage[],
  used: Set<HtmlXmlImage>,
  beforeY: number,
): WordImage[] {
  return images
    .filter((image) => !used.has(image) && image.yMin < beforeY)
    .sort((left, right) => left.yMin - right.yMin)
    .map((image) => {
      used.add(image);
      return {
        kind: "image" as const,
        src: image.src,
        widthPt: Math.max(1, image.xMax - image.xMin),
        heightPt: Math.max(1, image.yMax - image.yMin),
      };
    });
}

function reconstructFlow(
  texts: readonly HtmlXmlText[],
  images: readonly HtmlXmlImage[],
  pageWidth: number,
  bodySize: number,
  usedImages: Set<HtmlXmlImage>,
): WordBlock[] {
  const lines = clusterLines(texts);
  const threshold = gapThreshold(texts);
  const blocks: WordBlock[] = [];
  let index = 0;
  let pendingParagraph: WordParagraph | undefined;
  let pendingBottom = 0;

  function flushParagraph() {
    if (pendingParagraph !== undefined) {
      blocks.push(pendingParagraph);
      pendingParagraph = undefined;
    }
  }

  while (index < lines.length) {
    const line = lines[index];

    if (line === undefined) {
      break;
    }

    blocks.push(...placeImages(images, usedImages, line.yMin));

    const tableLength = isTableCandidate(lines, index, threshold, bodySize);

    if (tableLength > 0) {
      flushParagraph();
      blocks.push(toTable(lines.slice(index, index + tableLength), threshold));
      index += tableLength;
      continue;
    }

    if (isNumberedListLine(line, threshold)) {
      flushParagraph();
      const items: HtmlXmlRun[][] = [];
      let ordered = false;

      while (index < lines.length) {
        const current = lines[index];

        if (current === undefined || !isNumberedListLine(current, threshold)) {
          break;
        }

        const item = listItemRuns(current, threshold);

        if (runsText(item).length > 0) {
          items.push(item);
        }

        const firstText = current.texts[0];
        const label = firstText === undefined ? "" : textContent(firstText);
        ordered =
          ordered ||
          LIST_NUMBER_ONLY.test(label) ||
          /^\d{1,3}[.)]\s+/.test(runsText(flattenRuns(current.texts)));
        index += 1;
      }

      if (items.length > 0) {
        blocks.push({ kind: "list", ordered, items });
      }

      continue;
    }

    const runs = flattenRuns(line.texts);

    if (runsText(runs).length === 0) {
      index += 1;
      continue;
    }

    const level = headingLevel(runs, bodySize);
    const next: WordParagraph = {
      kind: level === undefined ? "paragraph" : "heading",
      headingLevel: level,
      align: lineAlign(line, pageWidth),
      runs,
    };

    if (
      pendingParagraph !== undefined &&
      canJoinParagraphs(pendingParagraph, next, pendingBottom, line.yMin)
    ) {
      const spacer = pendingParagraph.runs[pendingParagraph.runs.length - 1];
      pendingParagraph.runs = [
        ...pendingParagraph.runs,
        spacer === undefined
          ? { ...runs[0], text: " " }
          : { ...spacer, text: " ", underline: false },
        ...runs,
      ].filter((run): run is HtmlXmlRun => run !== undefined);
      pendingBottom = line.yMax;
      index += 1;
      continue;
    }

    flushParagraph();
    pendingParagraph = next;
    pendingBottom = line.yMax;
    index += 1;
  }

  flushParagraph();
  blocks.push(...placeImages(images, usedImages, Number.POSITIVE_INFINITY));
  return blocks;
}

export function reconstructWordDocument(
  pages: readonly HtmlXmlPage[],
): WordDocument {
  const first = pages[0];
  const bodySize = median(
    pages.flatMap((page) =>
      page.texts.flatMap((text) => text.runs.map((run) => run.fontSizePt)),
    ),
    11,
  );
  const blocks: WordBlock[] = [];

  for (const [pageIndex, page] of pages.entries()) {
    if (pageIndex > 0) {
      blocks.push({
        kind: "paragraph",
        align: "left",
        runs: [
          {
            text: "",
            fontFamily: "Arial",
            fontSizePt: bodySize,
            color: "#000000",
            bold: false,
            italic: false,
            underline: false,
          },
        ],
      });
    }

    const usedImages = new Set<HtmlXmlImage>();
    const flows = splitColumns(page);

    for (const flow of flows) {
      const flowImages =
        flows.length === 1
          ? page.images
          : page.images.filter((image) => {
              const mid = (image.xMin + image.xMax) / 2;
              const flowLeft = Math.min(...flow.map((text) => text.xMin));
              const flowRight = Math.max(...flow.map((text) => text.xMax));
              return mid >= flowLeft - 24 && mid <= flowRight + 24;
            });

      blocks.push(
        ...reconstructFlow(flow, flowImages, page.width, bodySize, usedImages),
      );
    }

    for (const image of page.images) {
      if (!usedImages.has(image)) {
        blocks.push({
          kind: "image",
          src: image.src,
          widthPt: Math.max(1, image.xMax - image.xMin),
          heightPt: Math.max(1, image.yMax - image.yMin),
        });
      }
    }
  }

  return {
    pageWidthPt: first?.width ?? 612,
    pageHeightPt: first?.height ?? 792,
    blocks: blocks.filter((block) => {
      if (block.kind === "paragraph" && pageBreakMarker(block)) {
        return true;
      }

      if (block.kind === "image") {
        return true;
      }

      if (block.kind === "table") {
        return block.rows.length > 0;
      }

      if (block.kind === "list") {
        return block.items.length > 0;
      }

      return runsText(block.runs).length > 0;
    }),
  };
}

function pageBreakMarker(block: WordParagraph): boolean {
  return block.runs.length === 1 && block.runs[0]?.text === "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cssFontFamily(family: string): string {
  if (/^[A-Za-z0-9 ]+$/.test(family)) {
    return `'${family}'`;
  }

  return "Arial";
}

function renderRuns(runs: readonly HtmlXmlRun[]): string {
  return runs
    .map((run) => {
      const styles = [
        `font-family:${cssFontFamily(run.fontFamily)}`,
        `font-size:${run.fontSizePt}pt`,
        `color:${run.color}`,
        `font-weight:${run.bold ? "700" : "400"}`,
        `font-style:${run.italic ? "italic" : "normal"}`,
        run.underline ? "text-decoration:underline" : undefined,
      ]
        .filter((part): part is string => part !== undefined)
        .join(";");

      return `<span style="${styles}">${escapeHtml(run.text)}</span>`;
    })
    .join("");
}

function renderBlock(block: WordBlock, pageBreak: boolean): string {
  if (pageBreak) {
    return '<div style="page-break-before:always"></div>';
  }

  switch (block.kind) {
    case "heading": {
      const tag = `h${block.headingLevel ?? 1}`;
      return `<${tag} style="text-align:${block.align};margin:0 0 10pt 0">${renderRuns(block.runs)}</${tag}>`;
    }
    case "paragraph":
      return `<p style="text-align:${block.align};margin:0 0 8pt 0">${renderRuns(block.runs)}</p>`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      return `<${tag}>${block.items
        .map((item) => `<li>${renderRuns(item)}</li>`)
        .join("")}</${tag}>`;
    }
    case "table":
      return `<table>${block.rows
        .map(
          (row) =>
            `<tr>${row
              .map((cell) => {
                const tag = cell.header ? "th" : "td";
                return `<${tag}>${renderRuns(cell.runs)}</${tag}>`;
              })
              .join("")}</tr>`,
        )
        .join("")}</table>`;
    case "image":
      return `<p style="margin:8pt 0"><img src="${escapeHtml(block.src)}" alt="" style="width:${block.widthPt}pt;height:${block.heightPt}pt;max-width:100%"/></p>`;
  }
}

export function wordDocumentToHtml(
  document: WordDocument,
  allowedImages: ReadonlySet<string>,
): string {
  const body = document.blocks
    .map((block) => {
      if (block.kind === "paragraph" && pageBreakMarker(block)) {
        return renderBlock(block, true);
      }

      if (block.kind === "image" && !allowedImages.has(block.src)) {
        return "";
      }

      return renderBlock(block, false);
    })
    .filter((part) => part.length > 0)
    .join("\n");

  const width = Math.max(1, document.pageWidthPt);
  const height = Math.max(1, document.pageHeightPt);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@page { size: ${width}pt ${height}pt; margin: 54pt; }
body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #111; }
h1, h2, h3 { font-weight: 700; }
table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
td, th { border: 0.5pt solid #333; padding: 4pt 8pt; vertical-align: top; }
th { font-weight: 700; }
img { display: block; }
</style>
</head>
<body>
${body}
</body>
</html>
`;
}

export function reconstructWordHtml(
  pages: readonly HtmlXmlPage[],
  allowedImages: ReadonlySet<string>,
): string {
  return wordDocumentToHtml(reconstructWordDocument(pages), allowedImages);
}
