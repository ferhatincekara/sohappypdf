import { describe, expect, test } from "bun:test";
import {
  allPages,
  pagesToRangeInput,
  pagesToRanges,
  rangesToPages,
  togglePage,
} from "./page-selection";

describe("page selection", () => {
  test("collapses consecutive pages into ranges", () => {
    expect(pagesToRanges([1, 2, 3, 5, 8, 9])).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 5 },
      { start: 8, end: 9 },
    ]);
    expect(pagesToRangeInput([1, 2, 3, 5])).toBe("1-3, 5");
  });

  test("expands ranges back into pages", () => {
    expect(
      rangesToPages([
        { start: 1, end: 3 },
        { start: 5, end: 5 },
      ]),
    ).toEqual([1, 2, 3, 5]);
  });

  test("toggles and enumerates pages", () => {
    expect(togglePage([1, 3], 2)).toEqual([1, 2, 3]);
    expect(togglePage([1, 2], 2)).toEqual([1]);
    expect(allPages(4)).toEqual([1, 2, 3, 4]);
  });
});
