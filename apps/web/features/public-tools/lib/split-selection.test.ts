import { describe, expect, test } from "bun:test";
import { selectedPagesFromSplitRanges } from "./split-selection";

describe("split selection", () => {
  test("expands valid ranges and ignores invalid input", () => {
    expect(selectedPagesFromSplitRanges("1-3, 5")).toEqual([1, 2, 3, 5]);
    expect(selectedPagesFromSplitRanges("")).toEqual([]);
    expect(selectedPagesFromSplitRanges("1-3, x")).toEqual([]);
  });
});
