import { describe, expect, test } from "bun:test";
import { listCatalogTools, listRegisteredTools } from "@repo/tools/catalog";
import {
  findToolCategoryBySlug,
  getMarketingToolDirectoryGroups,
  getMarketingToolDirectoryItems,
  getMarketingToolNavGroups,
  getMarketingToolNavItems,
  getRelatedMarketingTools,
  toolCategoryPath,
} from "./marketing-tools";

describe("marketing tool navigation", () => {
  test("lists every executable public tool path from the catalog", () => {
    const registered = listRegisteredTools();
    const items = getMarketingToolNavItems();

    expect(items.map((item) => item.id)).toEqual(
      registered.map((tool) => tool.id),
    );
    expect(items.map((item) => item.href)).toEqual(
      registered.map((tool) => tool.route),
    );
    expect(items.every((item) => item.availability !== "planned")).toBe(true);
  });

  test("groups executable tools by category without dropping any", () => {
    const items = getMarketingToolNavItems();
    const groups = getMarketingToolNavGroups();

    expect(groups.map((group) => group.category)).toEqual([
      "organize",
      "convert",
      "edit",
      "optimize",
      "security",
      "document",
      "intelligence",
    ]);
    expect(
      groups.flatMap((group) => group.tools.map((tool) => tool.id)).sort(),
    ).toEqual(items.map((item) => item.id).sort());
  });

  test("builds the full tool directory from catalog metadata", () => {
    const catalog = listCatalogTools();
    const items = getMarketingToolDirectoryItems();
    const groups = getMarketingToolDirectoryGroups();

    expect(items.map((item) => item.id).sort()).toEqual(
      catalog.map((tool) => tool.id).sort(),
    );
    expect(groups.map((group) => group.category)).toEqual([
      "organize",
      "convert",
      "edit",
      "optimize",
      "security",
      "document",
      "intelligence",
    ]);
    expect(
      groups.flatMap((group) => group.tools.map((tool) => tool.id)).sort(),
    ).toEqual(catalog.map((tool) => tool.id).sort());
  });

  test("returns related tools from the same category", () => {
    const merge = listRegisteredTools().find((tool) => tool.id === "merge-pdf");
    expect(merge).toBeDefined();
    if (merge === undefined) {
      throw new Error("merge-pdf must exist");
    }

    const related = getRelatedMarketingTools(merge, 4);
    expect(related.every((item) => item.category === merge.category)).toBe(
      true,
    );
    expect(related.some((item) => item.id === "merge-pdf")).toBe(false);
  });

  test("maps meaningful category landing paths", () => {
    expect(toolCategoryPath("organize")).toBe("/tools/organize-pdf");
    expect(toolCategoryPath("convert")).toBe("/tools/convert-pdf");
    expect(toolCategoryPath("security")).toBe("/tools/security");
    expect(toolCategoryPath("intelligence")).toBe("/tools/ocr");
    expect(findToolCategoryBySlug("organize-pdf")).toBe("organize");
    expect(findToolCategoryBySlug("missing")).toBeUndefined();
  });
});
