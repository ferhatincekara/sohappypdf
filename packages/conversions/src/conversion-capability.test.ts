import { describe, expect, test } from "bun:test";
import {
  findConversionTypes,
  findImplementedConversionTypes,
  getConversionCapability,
  isConversionImplemented,
  isConversionSupported,
  isSourceFormatAccepted,
  isTargetFormatAccepted,
} from "./conversion-capability.js";

describe("conversion capabilities", () => {
  test("detects supported format pairs for a conversion type", () => {
    expect(isConversionSupported("pdf-to-jpg", "pdf", "jpg")).toBe(true);
    expect(isConversionSupported("pdf-to-jpg", "pdf", "jpeg")).toBe(true);
    expect(isConversionSupported("word-to-pdf", "docx", "pdf")).toBe(true);
    expect(isConversionSupported("ocr-image", "jpg", "txt")).toBe(true);
  });

  test("rejects unsupported conversions", () => {
    expect(isConversionSupported("pdf-to-jpg", "pdf", "png")).toBe(false);
    expect(isConversionSupported("pdf-to-jpg", "docx", "jpg")).toBe(false);
    expect(isConversionSupported("jpg-to-pdf", "webp", "pdf")).toBe(false);
  });

  test("answers source and target format questions", () => {
    expect(isSourceFormatAccepted("excel-to-pdf", "xlsx")).toBe(true);
    expect(isSourceFormatAccepted("excel-to-pdf", "pdf")).toBe(false);
    expect(isTargetFormatAccepted("ocr-pdf", "txt")).toBe(true);
    expect(isTargetFormatAccepted("compress-pdf", "docx")).toBe(false);
    expect(getConversionCapability("pdf-to-word").targetFormats).toEqual([
      "docx",
    ]);
  });

  test("looks up conversion types from a format pair", () => {
    expect(findConversionTypes("pdf", "jpg")).toEqual(["pdf-to-jpg"]);
    expect(findConversionTypes("pdf", "txt")).toContain("pdf-to-txt");
    expect(findConversionTypes("pdf", "pdf")).toContain("merge-pdf");
    expect(findConversionTypes("pdf", "pdf")).toContain("compress-pdf");
    expect(findConversionTypes("webp", "pdf")).toEqual([]);
    expect(findImplementedConversionTypes("pdf", "jpg")).toEqual([
      "pdf-to-jpg",
    ]);
    expect(findImplementedConversionTypes("pdf", "xlsx")).toEqual([]);
  });

  test("distinguishes implemented engines from catalogued capabilities", () => {
    expect(isConversionImplemented("pdf-to-jpg")).toBe(true);
    expect(isConversionImplemented("pdf-to-txt")).toBe(true);
    expect(isConversionImplemented("ocr-pdf")).toBe(false);
    expect(isConversionImplemented("rotate-pdf")).toBe(false);
  });
});
