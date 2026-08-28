import { describe, expect, test } from "bun:test";
import { convertFormatLabel, formatLabel } from "./format-labels";

describe("convertFormatLabel", () => {
  test("uses friendly names for office formats", () => {
    expect(convertFormatLabel("docx")).toBe("Word");
    expect(convertFormatLabel("xlsx")).toBe("Excel");
    expect(convertFormatLabel("pptx")).toBe("PowerPoint");
    expect(convertFormatLabel("pdf")).toBe("PDF");
  });

  test("falls back to the generic format label", () => {
    expect(convertFormatLabel("png")).toBe(formatLabel("png"));
  });
});
