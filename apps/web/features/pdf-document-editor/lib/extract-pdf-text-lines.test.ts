import { describe, expect, test } from "bun:test";
import {
  groupPdfTextLines,
  resolveEditorFontFamily,
} from "@/features/pdf-document-editor/lib/extract-pdf-text-lines";

describe("extract pdf text lines", () => {
  test("maps PDF font names to Word-safe families", () => {
    expect(resolveEditorFontFamily("Times-Bold")).toBe("Times New Roman Bold");
    expect(resolveEditorFontFamily("Courier")).toBe("Courier New");
    expect(resolveEditorFontFamily("Helvetica")).toBe("Arial");
  });

  test("joins words on a baseline into one editable line", () => {
    const lines = groupPdfTextLines(
      [
        {
          str: "Sample",
          transform: [24, 0, 0, 24, 200, 720],
          width: 80,
          height: 24,
          fontName: "Times-Bold",
        },
        {
          str: "PDF",
          transform: [24, 0, 0, 24, 288, 720],
          width: 48,
          height: 24,
          fontName: "Times-Bold",
        },
        {
          str: "This PDF is three pages long.",
          transform: [12, 0, 0, 12, 72, 680],
          width: 200,
          height: 12,
          fontName: "Times-Roman",
        },
      ],
      1,
      792,
    );

    expect(lines).toHaveLength(2);
    expect(lines[0]?.text).toBe("Sample PDF");
    expect(lines[0]?.source).toBe("original");
    expect(lines[0]?.fontFamily).toBe("Times New Roman Bold");
    expect(lines[0]?.fontSize).toBe(24);
    expect(lines[1]?.text).toBe("This PDF is three pages long.");
    expect(lines[0]?.origin?.text).toBe("Sample PDF");
  });
});
