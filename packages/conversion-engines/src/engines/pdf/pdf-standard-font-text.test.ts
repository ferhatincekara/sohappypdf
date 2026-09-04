import { describe, expect, test } from "bun:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { toStandardFontText } from "./pdf-standard-font-text.js";

describe("toStandardFontText", () => {
  test("keeps WinAnsi text and rewrites characters standard fonts reject", async () => {
    const document = await PDFDocument.create();
    const font = await document.embedFont(StandardFonts.Helvetica);

    expect(toStandardFontText(font, "Hello PDF")).toBe("Hello PDF");
    expect(toStandardFontText(font, "Düzenlendi\n“şğüı” •")).toBe(
      'Düzenlendi "sgüi" -',
    );
    expect(toStandardFontText(font, "   ")).toBe("");
  });
});
