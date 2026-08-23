import { describe, expect, test } from "bun:test";
import {
  isCreatableConversion,
  listCreatableConversionTypes,
  listTargetFormats,
  resolveCreatableConversionType,
} from "./conversion-capabilities";

describe("conversion capabilities", () => {
  test("offers implemented output formats for a PDF source", () => {
    expect(listTargetFormats("pdf")).toEqual([
      "docx",
      "jpg",
      "png",
      "txt",
      "pdf",
    ]);
  });

  test("does not offer unimplemented office conversions", () => {
    expect(listTargetFormats("docx")).toEqual([]);
    expect(listCreatableConversionTypes("pdf", "xlsx")).toEqual([]);
    expect(isCreatableConversion("pdf", "xlsx")).toBe(false);
  });

  test("resolves a unique conversion type without a client-chosen type", () => {
    expect(resolveCreatableConversionType("pdf", "jpg")).toBe("pdf-to-jpg");
    expect(isCreatableConversion("pdf", "jpg")).toBe(true);
  });

  test("requires an explicit type for pdf to pdf", () => {
    expect(listCreatableConversionTypes("pdf", "pdf")).toEqual([
      "split-pdf",
      "compress-pdf",
    ]);
    expect(isCreatableConversion("pdf", "pdf")).toBe(false);
    expect(isCreatableConversion("pdf", "pdf", "compress-pdf")).toBe(true);
    expect(isCreatableConversion("pdf", "pdf", "merge-pdf")).toBe(false);
  });

  test("does not invent merge-pdf because the API cannot accept its options", () => {
    expect(listCreatableConversionTypes("pdf", "pdf")).not.toContain(
      "merge-pdf",
    );
  });
});
