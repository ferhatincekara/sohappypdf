import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import { resolveImplementedConversionType } from "./resolve-conversion-type.js";

describe("resolveImplementedConversionType", () => {
  test("selects the unique implemented conversion for a format pair", () => {
    expect(resolveImplementedConversionType("png", "pdf")).toBe("png-to-pdf");
    expect(resolveImplementedConversionType("pdf", "jpg")).toBe("pdf-to-jpg");
  });

  test("uses an explicit implemented type for ambiguous pairs", () => {
    expect(resolveImplementedConversionType("pdf", "pdf", "compress-pdf")).toBe(
      "compress-pdf",
    );
  });

  test("rejects unimplemented and ambiguous conversions", () => {
    try {
      resolveImplementedConversionType("pdf", "pdf");
      throw new Error("expected ambiguous pair to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }

    try {
      resolveImplementedConversionType("pdf", "xlsx");
      throw new Error("expected unimplemented pair to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }

    try {
      resolveImplementedConversionType("pdf", "pdf", "ocr-pdf");
      throw new Error("expected unimplemented type to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
