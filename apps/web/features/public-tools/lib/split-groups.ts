export type SplitGroup = {
  start: number;
  end: number;
};

export function rangesFromSplitAfter(
  pageCount: number,
  splitAfter: readonly number[],
): SplitGroup[] {
  if (pageCount < 1) {
    return [];
  }

  const cuts = [...new Set(splitAfter)]
    .filter((page) => page >= 1 && page < pageCount)
    .sort((left, right) => left - right);

  const groups: SplitGroup[] = [];
  let start = 1;

  for (const cut of cuts) {
    groups.push({ start, end: cut });
    start = cut + 1;
  }

  groups.push({ start, end: pageCount });
  return groups;
}

export function splitAfterFromRanges(
  ranges: readonly SplitGroup[],
): number[] {
  if (ranges.length < 2) {
    return [];
  }

  return ranges.slice(0, -1).map((range) => range.end);
}

export function toggleSplitAfter(
  splitAfter: readonly number[],
  page: number,
): number[] {
  if (splitAfter.includes(page)) {
    return splitAfter.filter((value) => value !== page);
  }

  return [...splitAfter, page].sort((left, right) => left - right);
}

export function formatSplitGroupLabel(group: SplitGroup): string {
  if (group.start === group.end) {
    return String(group.start);
  }

  return `${group.start}–${group.end}`;
}

export function groupsToRangeInput(groups: readonly SplitGroup[]): string {
  return groups
    .map((group) =>
      group.start === group.end
        ? String(group.start)
        : `${group.start}-${group.end}`,
    )
    .join(", ");
}
