import { describe, expect, test } from "bun:test";
import { findRegisteredTool } from "@repo/tools/catalog";
import { MARKETING_PATHS } from "./marketing-paths";
import { getMarketingToolShortcuts } from "./marketing-tool-shortcuts";

describe("marketing tool shortcuts", () => {
  test("exposes Merge, Split, Compress, Convert, OCR, and Protect from the registry", () => {
    const shortcuts = getMarketingToolShortcuts();

    expect(shortcuts.map((item) => item.id)).toEqual([
      "merge",
      "split",
      "compress",
      "convert",
      "ocr",
      "protect",
    ]);
    expect(shortcuts.find((item) => item.id === "merge")?.href).toBe(
      findRegisteredTool("merge-pdf")?.route,
    );
    expect(shortcuts.find((item) => item.id === "split")?.href).toBe(
      findRegisteredTool("split-pdf")?.route,
    );
    expect(shortcuts.find((item) => item.id === "compress")?.href).toBe(
      findRegisteredTool("compress-pdf")?.route,
    );
    expect(shortcuts.find((item) => item.id === "convert")?.href).toBe(
      `${MARKETING_PATHS.tools}#convert`,
    );
    expect(shortcuts.find((item) => item.id === "ocr")?.href).toBe(
      findRegisteredTool("ocr-pdf")?.route,
    );
    expect(shortcuts.find((item) => item.id === "protect")?.href).toBe(
      findRegisteredTool("protect-pdf")?.route,
    );
  });
});
