import { describe, expect, test } from "bun:test";
import { parsePdftohtmlXml } from "./pdftohtml-xml.js";
import {
  reconstructWordDocument,
  reconstructWordHtml,
} from "./word-reconstruction.js";

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<pdf2xml>
<page number="1" position="absolute" top="0" left="0" height="792" width="612">
<fontspec id="0" size="28" family="Helvetica-Bold" color="#111111"/>
<fontspec id="1" size="12" family="Helvetica" color="#222222"/>
<fontspec id="2" size="10" family="Helvetica" color="#333333"/>
<text top="120" left="200" width="180" height="30" font="0"><b>Recovery Kit</b></text>
<text top="180" left="86" width="360" height="14" font="1">If you need access to the original device</text>
<text top="210" left="86" width="220" height="14" font="1">you can continue from here.</text>
<text top="260" left="110" width="8" height="12" font="1">1</text>
<text top="258" left="132" width="180" height="14" font="1">Launch the app</text>
<text top="286" left="110" width="8" height="12" font="1">2</text>
<text top="284" left="132" width="140" height="14" font="1">Open Settings</text>
<text top="430" left="110" width="40" height="10" font="2">alpha</text>
<text top="430" left="210" width="50" height="10" font="2">bravo</text>
<text top="430" left="310" width="50" height="10" font="2">charlie</text>
<text top="430" left="410" width="40" height="10" font="2">delta</text>
<text top="458" left="110" width="36" height="10" font="2">echo</text>
<text top="458" left="210" width="52" height="10" font="2">foxtrot</text>
<text top="458" left="310" width="36" height="10" font="2">golf</text>
<text top="458" left="410" width="40" height="10" font="2">hotel</text>
</page>
</pdf2xml>`;

describe("word reconstruction", () => {
  test("rebuilds headings, joined paragraphs, lists, and tables with styles", () => {
    const document = reconstructWordDocument(parsePdftohtmlXml(SAMPLE));
    const kinds = document.blocks.map((block) => block.kind);

    expect(kinds).toEqual(["heading", "paragraph", "list", "table"]);

    const heading = document.blocks[0];
    expect(heading?.kind).toBe("heading");
    if (heading?.kind === "heading") {
      expect(heading.headingLevel).toBe(1);
      expect(heading.runs[0]?.bold).toBe(true);
      expect(heading.runs[0]?.fontSizePt).toBe(28);
    }

    const paragraph = document.blocks[1];
    if (paragraph?.kind === "paragraph") {
      expect(paragraph.runs.map((run) => run.text).join("")).toContain(
        "If you need access",
      );
      expect(paragraph.runs.map((run) => run.text).join("")).toContain(
        "you can continue",
      );
    }

    const list = document.blocks[2];
    if (list?.kind === "list") {
      expect(list.ordered).toBe(true);
      expect(
        list.items.map((item) => item.map((run) => run.text).join("")),
      ).toEqual(["Launch the app", "Open Settings"]);
    }

    const table = document.blocks[3];
    if (table?.kind === "table") {
      expect(
        table.rows.map((row) =>
          row.map((cell) => cell.runs.map((run) => run.text).join("")),
        ),
      ).toEqual([
        ["alpha", "bravo", "charlie", "delta"],
        ["echo", "foxtrot", "golf", "hotel"],
      ]);
    }
  });

  test("writes styled HTML and escapes PDF text", () => {
    const html = reconstructWordHtml(parsePdftohtmlXml(SAMPLE), new Set());

    expect(html).toContain("<h1");
    expect(html).toContain("font-size:28pt");
    expect(html).toContain("font-weight:700");
    expect(html).toContain("<table>");
    expect(html).toContain("<th>");
    expect(html).toContain("Launch the app");

    const unsafe = reconstructWordHtml(
      parsePdftohtmlXml(`<pdf2xml><page width="612" height="792">
        <fontspec id="0" size="12" family="Helvetica" color="#000000"/>
        <text top="100" left="80" width="80" height="14" font="0">A &lt;b&gt;B</text>
      </page></pdf2xml>`),
      new Set(),
    );

    expect(unsafe).toContain("A &lt;b&gt;B");
    expect(unsafe).not.toContain("<b>B");
  });
});
