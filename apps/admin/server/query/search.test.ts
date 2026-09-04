import { describe, expect, test } from "bun:test";
import { matchesCatalogTool } from "./search-match.ts";

const tool = {
  id: "merge-pdf",
  route: "/merge-pdf",
  category: "organize",
  processorId: "pdf-merge",
  nameKey: "tools.mergePdf.name",
};

describe("matchesCatalogTool", () => {
  test("matches tool id, route, category, and processor fragments", () => {
    expect(matchesCatalogTool(tool, "merge")).toBe(true);
    expect(matchesCatalogTool(tool, "organize")).toBe(true);
    expect(matchesCatalogTool(tool, "pdf-merge")).toBe(true);
    expect(matchesCatalogTool(tool, "billing")).toBe(false);
  });
});
