import { describe, expect, test } from "bun:test";
import { createPdfPages } from "../types/pdf-page";
import {
  allPages,
  applyPageActivation,
  isAllPagesSelected,
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
    expect(isAllPagesSelected([1, 2, 3, 4], 4)).toBe(true);
    expect(isAllPagesSelected([1, 2, 3], 4)).toBe(false);
  });

  test("builds the smallest page model from a count and selection", () => {
    expect(createPdfPages(3, [2])).toEqual([
      {
        id: "page-1",
        pageIndex: 0,
        pageNumber: 1,
        selected: false,
        rotation: 0,
      },
      {
        id: "page-2",
        pageIndex: 1,
        pageNumber: 2,
        selected: true,
        rotation: 0,
      },
      {
        id: "page-3",
        pageIndex: 2,
        pageNumber: 3,
        selected: false,
        rotation: 0,
      },
    ]);
  });

  test("toggles a page on click in multiple mode", () => {
    expect(
      applyPageActivation({
        selectedPages: [1],
        pageNumber: 3,
        pageCount: 5,
        anchor: 1,
        mode: "multiple",
        modifiers: { additive: false, range: false },
      }),
    ).toEqual({
      selectedPages: [1, 3],
      anchor: 3,
    });
  });

  test("selects a shift range from the anchor", () => {
    expect(
      applyPageActivation({
        selectedPages: [2],
        pageNumber: 5,
        pageCount: 8,
        anchor: 2,
        mode: "multiple",
        modifiers: { additive: false, range: true },
      }),
    ).toEqual({
      selectedPages: [2, 3, 4, 5],
      anchor: 2,
    });
  });

  test("adds a shift range to the current selection when additive", () => {
    expect(
      applyPageActivation({
        selectedPages: [1],
        pageNumber: 4,
        pageCount: 8,
        anchor: 2,
        mode: "multiple",
        modifiers: { additive: true, range: true },
      }),
    ).toEqual({
      selectedPages: [1, 2, 3, 4],
      anchor: 2,
    });
  });

  test("selects only one page in single mode", () => {
    expect(
      applyPageActivation({
        selectedPages: [1, 2],
        pageNumber: 4,
        pageCount: 6,
        anchor: 1,
        mode: "single",
        modifiers: { additive: true, range: false },
      }),
    ).toEqual({
      selectedPages: [4],
      anchor: 4,
    });
  });
});
