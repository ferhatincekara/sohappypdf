import { describe, expect, test } from "bun:test";
import { getMegaMenuSections } from "@/features/marketing/lib/mega-menu-sections";

describe("mega menu sections", () => {
  test("exposes conversion shortcuts including Word to PDF", () => {
    const sections = getMegaMenuSections();
    const ids = sections.flatMap((section) =>
      section.tools.map((tool) => tool.id),
    );

    expect(sections.map((section) => section.id)).toEqual([
      "organize",
      "convertFrom",
      "convertTo",
      "edit",
      "security",
    ]);
    expect(ids.filter((id) => id === "merge-pdf")).toHaveLength(1);
    expect(ids).toContain("compress-pdf");
    expect(ids).toContain("ocr-pdf");
    expect(ids).toContain("word-to-pdf");
    expect(ids).toContain("excel-to-pdf");
    expect(ids).toContain("redact-pdf");
    expect(ids).not.toContain("ai-summarizer");
    expect(ids).not.toContain("translate-pdf");
    expect(ids).not.toContain("web-to-pdf");
  });
});
