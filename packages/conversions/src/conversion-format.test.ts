import { describe, expect, test } from "bun:test";
import { isFileFormat, normalizeFileFormat } from "./conversion-format.js";

describe("conversion format", () => {
  test("accepts the catalogued formats", () => {
    expect(isFileFormat("pdf")).toBe(true);
    expect(isFileFormat("docx")).toBe(true);
    expect(isFileFormat("webp")).toBe(true);
    expect(isFileFormat("gif")).toBe(false);
  });

  test("normalizes jpeg to jpg", () => {
    expect(normalizeFileFormat("JPEG")).toBe("jpg");
    expect(normalizeFileFormat("jpg")).toBe("jpg");
    expect(normalizeFileFormat("unknown")).toBeUndefined();
  });
});
