import {
  blockText,
  type LayoutBlock,
  type LayoutBox,
  type LayoutPage,
} from "./pdf-layout.js";

export type LayoutSection =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; rows: string[][] };

const ROW_OVERLAP_RATIO = 0.4;
const COLUMN_TOLERANCE = 24;
const HEADING_MIN_HEIGHT = 20;
const LIST_NUMBER_MAX_WIDTH = 24;
const TABLE_CELL_MAX_WORDS = 3;

function verticalOverlap(left: LayoutBox, right: LayoutBox): number {
  return Math.max(
    0,
    Math.min(left.yMax, right.yMax) - Math.max(left.yMin, right.yMin),
  );
}

function sameRow(left: LayoutBox, right: LayoutBox): boolean {
  const overlap = verticalOverlap(left, right);
  const minHeight = Math.min(left.yMax - left.yMin, right.yMax - right.yMin);

  if (minHeight <= 0) {
    return Math.abs(left.yMin - right.yMin) < 8;
  }

  return overlap / minHeight >= ROW_OVERLAP_RATIO;
}

export function clusterLayoutRows(
  blocks: readonly LayoutBlock[],
): LayoutBlock[][] {
  const sorted = [...blocks].sort((left, right) => {
    const top = left.yMin - right.yMin;
    return top === 0 ? left.xMin - right.xMin : top;
  });
  const rows: LayoutBlock[][] = [];

  for (const block of sorted) {
    const current = rows[rows.length - 1];

    if (current !== undefined && sameRow(current[0] ?? block, block)) {
      current.push(block);
      current.sort((left, right) => left.xMin - right.xMin);
      continue;
    }

    rows.push([block]);
  }

  return rows;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter((part) => part.length > 0).length;
}

function isHeadingRow(row: readonly LayoutBlock[], page: LayoutPage): boolean {
  if (row.length !== 1) {
    return false;
  }

  const block = row[0];

  if (block === undefined || block.lines.length !== 1) {
    return false;
  }

  const text = blockText(block);
  const height = block.yMax - block.yMin;
  const widthRatio =
    page.width > 0 ? (block.xMax - block.xMin) / page.width : 1;
  const center = (block.xMin + block.xMax) / 2;
  const centered = Math.abs(center - page.width / 2) <= page.width * 0.12;

  return (
    text.length > 0 &&
    height >= HEADING_MIN_HEIGHT &&
    wordCount(text) <= 8 &&
    widthRatio <= 0.45 &&
    centered
  );
}

function isListRow(row: readonly LayoutBlock[]): boolean {
  const first = row[0];

  if (first === undefined || row.length < 2) {
    return false;
  }

  const label = blockText(first);
  return (
    /^\d+$/.test(label) && first.xMax - first.xMin <= LIST_NUMBER_MAX_WIDTH
  );
}

function isTableRow(row: readonly LayoutBlock[]): boolean {
  return (
    row.length >= 2 &&
    row.every((block) => wordCount(blockText(block)) <= TABLE_CELL_MAX_WORDS)
  );
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

function toTableRows(rows: readonly LayoutBlock[][]): string[][] {
  const columns = clusterColumns(
    rows.flatMap((row) => row.map((block) => block.xMin)),
  );

  return rows.map((row) => {
    const cells = Array.from({ length: columns.length }, () => "");

    for (const block of row) {
      const index = assignColumn(block.xMin, columns);
      const current = cells[index];
      const next = blockText(block);
      cells[index] =
        current === undefined || current.length === 0
          ? next
          : `${current} ${next}`;
    }

    return cells;
  });
}

function listItemText(row: readonly LayoutBlock[]): string {
  return row
    .slice(1)
    .map((block) => blockText(block))
    .filter((text) => text.length > 0)
    .join(" — ");
}

export function layoutPagesToSections(
  pages: readonly LayoutPage[],
): LayoutSection[] {
  const sections: LayoutSection[] = [];

  for (const page of pages) {
    const rows = clusterLayoutRows(page.blocks);
    let index = 0;

    while (index < rows.length) {
      const row = rows[index];

      if (row === undefined) {
        break;
      }

      if (isListRow(row)) {
        const items: string[] = [];

        while (index < rows.length) {
          const current = rows[index];

          if (current === undefined || !isListRow(current)) {
            break;
          }

          const item = listItemText(current);

          if (item.length > 0) {
            items.push(item);
          }

          index += 1;
        }

        if (items.length > 0) {
          sections.push({ kind: "list", items });
        }

        continue;
      }

      if (isTableRow(row)) {
        const tableRows: LayoutBlock[][] = [];

        while (index < rows.length) {
          const current = rows[index];

          if (
            current === undefined ||
            isListRow(current) ||
            !isTableRow(current)
          ) {
            break;
          }

          tableRows.push(current);
          index += 1;
        }

        sections.push({ kind: "table", rows: toTableRows(tableRows) });
        continue;
      }

      const text = row
        .map((block) => blockText(block))
        .join(" ")
        .trim();

      if (text.length > 0) {
        sections.push({
          kind: isHeadingRow(row, page) ? "heading" : "paragraph",
          text,
        });
      }

      index += 1;
    }
  }

  return sections;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSection(section: LayoutSection): string {
  switch (section.kind) {
    case "heading":
      return `<h1>${escapeHtml(section.text)}</h1>`;
    case "paragraph":
      return `<p>${escapeHtml(section.text)}</p>`;
    case "list":
      return `<ol>${section.items
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ol>`;
    case "table":
      return `<table>${section.rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
        )
        .join("")}</table>`;
  }
}

export function layoutPagesToHtml(pages: readonly LayoutPage[]): string {
  const sections = layoutPagesToSections(pages);
  const body = sections.map(renderSection).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: Helvetica, Arial, sans-serif; font-size: 12pt; }
h1 { font-size: 22pt; text-align: center; }
p, li { line-height: 1.4; }
table { border-collapse: collapse; width: 100%; margin-top: 16pt; }
td { padding: 6pt 10pt; }
</style>
</head>
<body>
${body}
</body>
</html>
`;
}
