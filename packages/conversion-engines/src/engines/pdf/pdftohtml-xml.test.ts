import { describe, expect, test } from "bun:test";
import {
  countHtmlXmlTextChars,
  parsePdftohtmlXml,
  safeHtmlXmlImageSrc,
} from "./pdftohtml-xml.js";

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<pdf2xml producer="poppler" version="24.02.0">
<page number="1" position="absolute" top="0" left="0" height="792" width="612">
<fontspec id="0" size="28" family="Helvetica-Bold" color="#111111"/>
<fontspec id="1" size="12" family="TimesNewRomanPSMT" color="#222222"/>
<image top="40" left="50" width="120" height="40" src="word-layout-1_1.png"/>
<text top="120" left="180" width="220" height="30" font="0"><b>Recovery Kit</b></text>
<text top="200" left="86" width="80" height="14" font="1">Hello <i>world</i></text>
<text top="200" left="180" width="40" height="14" font="1">A &amp; B</text>
</page>
</pdf2xml>`;

describe("pdftohtml xml", () => {
  test("parses fonts, styled runs, and images", () => {
    const pages = parsePdftohtmlXml(SAMPLE);
    const page = pages[0];

    expect(pages).toHaveLength(1);
    expect(page?.width).toBe(612);
    expect(page?.fonts.get("0")?.fontFamily).toBe("Arial");
    expect(page?.fonts.get("0")?.bold).toBe(true);
    expect(page?.fonts.get("1")?.fontFamily).toBe("Times New Roman");
    expect(page?.images[0]?.src).toBe("word-layout-1_1.png");

    const title = page?.texts[0]?.runs[0];
    expect(title?.text).toBe("Recovery Kit");
    expect(title?.bold).toBe(true);
    expect(title?.fontSizePt).toBe(28);

    const body = page?.texts[1]?.runs;
    expect(body?.map((run) => run.text)).toEqual(["Hello ", "world"]);
    expect(body?.[1]?.italic).toBe(true);
    expect(page?.texts[2]?.runs[0]?.text).toBe("A & B");
    expect(countHtmlXmlTextChars(pages)).toBeGreaterThan(10);
  });

  test("rejects path-traversal image names", () => {
    expect(safeHtmlXmlImageSrc("../secret.png")).toBeUndefined();
    expect(safeHtmlXmlImageSrc("word-layout-1_1.png")).toBe(
      "word-layout-1_1.png",
    );
  });
});
