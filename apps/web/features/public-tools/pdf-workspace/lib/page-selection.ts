export type PageRange = {
  start: number;
  end: number;
};

export type PageSelectionMode = "multiple" | "single";

export type PageActivationModifiers = {
  additive: boolean;
  range: boolean;
};

export type PageActivationResult = {
  selectedPages: number[];
  anchor: number;
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

export function isAllPagesSelected(
  selectedPages: readonly number[],
  pageCount: number,
): boolean {
  return pageCount > 0 && uniqueSortedPages(selectedPages).length === pageCount;
}

export function pageActivationFromPointerEvent(event: {
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
}): PageActivationModifiers {
  return {
    additive: event.metaKey || event.ctrlKey,
    range: event.shiftKey,
  };
}

export function applyPageActivation(input: {
  selectedPages: readonly number[];
  pageNumber: number;
  pageCount: number;
  anchor: number | null;
  mode: PageSelectionMode;
  modifiers: PageActivationModifiers;
}): PageActivationResult {
  if (input.pageNumber < 1 || input.pageNumber > input.pageCount) {
    return {
      selectedPages: uniqueSortedPages(input.selectedPages),
      anchor: input.anchor ?? 1,
    };
  }

  if (input.modifiers.range && input.anchor !== null) {
    const range = selectPageRange(
      input.anchor,
      input.pageNumber,
      input.pageCount,
    );

    if (input.mode === "single" || !input.modifiers.additive) {
      return {
        selectedPages: range,
        anchor: input.anchor,
      };
    }

    return {
      selectedPages: uniqueSortedPages([...input.selectedPages, ...range]),
      anchor: input.anchor,
    };
  }

  if (input.mode === "single") {
    return {
      selectedPages: [input.pageNumber],
      anchor: input.pageNumber,
    };
  }

  return {
    selectedPages: togglePage(input.selectedPages, input.pageNumber),
    anchor: input.pageNumber,
  };
}
