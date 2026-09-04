import { describe, expect, test } from "bun:test";
import {
  formatSplitGroupLabel,
  groupsToRangeInput,
  rangesFromSplitAfter,
  splitAfterFromRanges,
  toggleSplitAfter,
} from "@/features/public-tools/lib/split-groups";

describe("split groups", () => {
  test("builds contiguous parts from split-after marks", () => {
    expect(rangesFromSplitAfter(6, [3])).toEqual([
      { start: 1, end: 3 },
      { start: 4, end: 6 },
    ]);
    expect(rangesFromSplitAfter(6, [2, 5])).toEqual([
      { start: 1, end: 2 },
      { start: 3, end: 5 },
      { start: 6, end: 6 },
    ]);
    expect(rangesFromSplitAfter(3, [])).toEqual([{ start: 1, end: 3 }]);
  });

  test("round-trips ranges and toggles split marks", () => {
    const ranges = rangesFromSplitAfter(6, [3]);
    expect(splitAfterFromRanges(ranges)).toEqual([3]);
    expect(toggleSplitAfter([3], 3)).toEqual([]);
    expect(toggleSplitAfter([], 3)).toEqual([3]);
    expect(formatSplitGroupLabel({ start: 1, end: 3 })).toBe("1–3");
    expect(formatSplitGroupLabel({ start: 4, end: 4 })).toBe("4");
    expect(groupsToRangeInput(ranges)).toBe("1-3, 4-6");
  });
});
