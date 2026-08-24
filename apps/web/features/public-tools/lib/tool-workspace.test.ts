import { describe, expect, test } from "bun:test";
import {
  buildToolConversionOptions,
  DEFAULT_TOOL_WORKSPACE_STATE,
  parsePageListInput,
  parseSplitRangesInput,
} from "./tool-workspace";

describe("tool workspace helpers", () => {
  test("parses page lists and split ranges", () => {
    expect(parsePageListInput("1, 2, 3")).toEqual([1, 2, 3]);
    expect(parsePageListInput("")).toBeUndefined();
    expect(parsePageListInput("1, x")).toBeUndefined();
    expect(parseSplitRangesInput("1-3, 5")).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 5 },
    ]);
    expect(parseSplitRangesInput("bad")).toBeUndefined();
  });

  test("builds conversion options per tool", () => {
    expect(
      buildToolConversionOptions("compress-pdf", DEFAULT_TOOL_WORKSPACE_STATE),
    ).toEqual({ level: "medium" });

    expect(
      buildToolConversionOptions("rotate-pdf", DEFAULT_TOOL_WORKSPACE_STATE),
    ).toEqual({ degrees: 90 });

    expect(
      buildToolConversionOptions("split-pdf", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        splitRanges: "1-2",
      }),
    ).toEqual({ ranges: [{ start: 1, end: 2 }] });

    expect(
      buildToolConversionOptions("reorder-pages", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        pageOrder: "2, 1",
      }),
    ).toEqual({ order: [2, 1] });

    expect(
      buildToolConversionOptions("remove-pages", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        pagesToRemove: "2",
      }),
    ).toEqual({ pages: [2] });

    expect(
      buildToolConversionOptions("watermark-pdf", DEFAULT_TOOL_WORKSPACE_STATE),
    ).toEqual({ text: "CONFIDENTIAL" });

    expect(
      buildToolConversionOptions("protect-pdf", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        password: "",
      }),
    ).toBeUndefined();

    expect(
      buildToolConversionOptions("protect-pdf", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        password: "secret",
      }),
    ).toEqual({ password: "secret" });

    expect(
      buildToolConversionOptions("ai-summarizer", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        outputFormat: "md",
      }),
    ).toEqual({ language: "eng", outputMode: "md" });

    expect(
      buildToolConversionOptions("translate-pdf", DEFAULT_TOOL_WORKSPACE_STATE),
    ).toEqual({ targetLanguage: "eng" });
  });
});
