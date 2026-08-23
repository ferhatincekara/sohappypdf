import { describe, expect, test } from "bun:test";
import { safeConversionFailureKey } from "./conversion-failure";

describe("conversion failure keys", () => {
  test("maps known backend failure codes", () => {
    expect(safeConversionFailureKey("processing_failed")).toBe(
      "processing_failed",
    );
    expect(safeConversionFailureKey("cancelled")).toBe("cancelled");
  });

  test("does not surface unknown worker messages", () => {
    expect(safeConversionFailureKey("AccessDenied: stack")).toBe(
      "processing_failed",
    );
    expect(safeConversionFailureKey(undefined)).toBe("processing_failed");
  });
});
