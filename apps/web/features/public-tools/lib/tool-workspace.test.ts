import { describe, expect, test } from "bun:test";
import {
  buildToolConversionOptions,
  DEFAULT_TOOL_WORKSPACE_STATE,
  parseOrganizeOrderInput,
  parseOrganizeRotationsInput,
  parsePageListInput,
  parseSelectedPagesInput,
  parseSplitRangesInput,
} from "./tool-workspace";

describe("tool workspace helpers", () => {
  test("parses page lists and split ranges", () => {
    expect(parsePageListInput("1, 2, 3")).toEqual([1, 2, 3]);
    expect(parsePageListInput("")).toBeUndefined();
    expect(parsePageListInput("1, x")).toBeUndefined();
    expect(parsePageListInput("1, 1")).toBeUndefined();
    expect(parseOrganizeOrderInput("3, 1, 1")).toEqual([3, 1, 1]);
    expect(parseOrganizeRotationsInput("90, 0, 180", 3)).toEqual([90, 0, 180]);
    expect(parseOrganizeRotationsInput("90", 3)).toBeUndefined();
    expect(parseSplitRangesInput("1-3, 5")).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 5 },
    ]);
    expect(parseSplitRangesInput("bad")).toBeUndefined();
    expect(parseSelectedPagesInput("1-3, 5")).toEqual([1, 2, 3, 5]);
    expect(parseSelectedPagesInput("")).toEqual([]);
  });

  test("builds conversion options per tool", () => {
    expect(
      buildToolConversionOptions("compress-pdf", DEFAULT_TOOL_WORKSPACE_STATE),
    ).toEqual({ level: "medium" });

    expect(
      buildToolConversionOptions("rotate-pdf", DEFAULT_TOOL_WORKSPACE_STATE),
    ).toBeUndefined();

    expect(
      buildToolConversionOptions("rotate-pdf", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        pageSelection: "1-2",
        rotationDegrees: 90,
      }),
    ).toEqual({ degrees: 90, pages: [1, 2] });

    expect(
      buildToolConversionOptions("extract-pages", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        splitRanges: "1-2",
      }),
    ).toEqual({ ranges: [{ start: 1, end: 2 }] });

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
      buildToolConversionOptions("organize-pdf", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        pageOrder: "3, 1, 1",
        pageRotations: "90, 0, 180",
      }),
    ).toEqual({ order: [3, 1, 1], rotations: [90, 0, 180] });

    expect(
      buildToolConversionOptions("organize-pdf", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        pageOrder: "2, 1",
        pageRotations: "0, 0",
      }),
    ).toEqual({ order: [2, 1] });

    expect(
      buildToolConversionOptions("remove-pages", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        pagesToRemove: "2",
      }),
    ).toEqual({ pages: [2] });

    expect(
      buildToolConversionOptions("remove-pages", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        pagesToRemove: "1-2",
      }),
    ).toEqual({ pages: [1, 2] });

    expect(
      buildToolConversionOptions("watermark-pdf", DEFAULT_TOOL_WORKSPACE_STATE),
    ).toEqual({ text: "CONFIDENTIAL", opacity: 0.25 });

    expect(
      buildToolConversionOptions("ocr-pdf", DEFAULT_TOOL_WORKSPACE_STATE),
    ).toEqual({ language: "eng", outputMode: "pdf" });

    expect(
      buildToolConversionOptions("ocr-pdf", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        targetLanguage: "tur",
        outputFormat: "txt",
      }),
    ).toEqual({ language: "tur", outputMode: "txt" });

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
    ).toBeUndefined();

    expect(
      buildToolConversionOptions("protect-pdf", {
        ...DEFAULT_TOOL_WORKSPACE_STATE,
        password: "secret",
        confirmPassword: "secret",
      }),
    ).toEqual({ password: "secret" });

    expect(
      buildToolConversionOptions("unlock-pdf", {
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
