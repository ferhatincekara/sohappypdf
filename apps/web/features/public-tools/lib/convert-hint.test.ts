import { describe, expect, test } from "bun:test";
import { convertHintKey } from "@/features/public-tools/lib/convert-hint";

describe("convertHintKey", () => {
  test("selects tool-specific conversion copy", () => {
    expect(convertHintKey("pdf-to-excel")).toBe("excelHint");
    expect(convertHintKey("pdf-to-word-ocr")).toBe("wordOcrHint");
    expect(convertHintKey("pdf-to-pdfa")).toBe("pdfaHint");
    expect(convertHintKey("jpg-to-pdf")).toBe("imageHint");
    expect(convertHintKey("pdf-to-txt")).toBe("textHint");
    expect(convertHintKey("pdf-to-word")).toBe("hint");
  });
});
