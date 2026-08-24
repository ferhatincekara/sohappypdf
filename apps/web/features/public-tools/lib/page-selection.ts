export type PageRange = {
  start: number;
  end: number;
};

export function uniqueSortedPages(pages: readonly number[]): number[] {
  return [
    ...new Set(pages.filter((page) => Number.isInteger(page) && page > 0)),
  ].sort((left, right) => left - right);
}

export function pagesToRanges(pages: readonly number[]): PageRange[] {
  const sorted = uniqueSortedPages(pages);

  if (sorted.length === 0) {
    return [];
  }

  const ranges: PageRange[] = [];
  let start = sorted[0] ?? 1;
  let previous = start;

  for (const page of sorted.slice(1)) {
    if (page === previous + 1) {
      previous = page;
      continue;
    }

    ranges.push({ start, end: previous });
    start = page;
    previous = page;
  }

  ranges.push({ start, end: previous });
  return ranges;
}

export function rangesToPages(ranges: readonly PageRange[]): number[] {
  const pages: number[] = [];

  for (const range of ranges) {
    if (range.end < range.start || range.start < 1) {
      continue;
    }

    for (let page = range.start; page <= range.end; page += 1) {
      pages.push(page);
    }
  }

  return uniqueSortedPages(pages);
}

export function pagesToRangeInput(pages: readonly number[]): string {
  return pagesToRanges(pages)
    .map((range) =>
      range.start === range.end
        ? String(range.start)
        : `${range.start}-${range.end}`,
    )
    .join(", ");
}

export function togglePage(pages: readonly number[], page: number): number[] {
  if (pages.includes(page)) {
    return pages.filter((item) => item !== page);
  }

  return uniqueSortedPages([...pages, page]);
}

export function selectPageRange(
  from: number,
  to: number,
  pageCount: number,
): number[] {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    if (page >= 1 && page <= pageCount) {
      pages.push(page);
    }
  }

  return pages;
}

export function allPages(pageCount: number): number[] {
  if (pageCount < 1) {
    return [];
  }

  return Array.from({ length: pageCount }, (_, index) => index + 1);
}
