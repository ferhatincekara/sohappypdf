import { describe, expect, test } from "bun:test";
import { listCatalogTools, listRegisteredTools } from "@repo/tools/catalog";
import {
  findToolCategoryBySlug,
  getMarketingToolDirectoryGroups,
  getMarketingToolDirectoryItems,
  getMarketingToolNavGroups,
  getMarketingToolNavItems,
  getRelatedMarketingTools,
  sortMarketingNavTools,
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
    expect(items.find((item) => item.id === "ocr-pdf")?.premium).toBe(true);
    expect(items.find((item) => item.id === "merge-pdf")?.premium).toBe(false);
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
    expect(
      items.find((item) => item.id === "translate-pdf")?.availability,
    ).toBe("planned");
    expect(items.find((item) => item.id === "translate-pdf")?.premium).toBe(
      true,
    );
    expect(
      items.find((item) => item.id === "ai-summarizer")?.availability,
    ).toBe("planned");
  });

  test("sorts category tools as standard, Pro, then Soon", () => {
    const rank = (tool: { availability: string; premium: boolean }) => {
      if (tool.availability === "planned") {
        return 2;
      }

      if (tool.premium) {
        return 1;
      }

      return 0;
    };

    const groups = getMarketingToolDirectoryGroups();

    for (const group of groups) {
      const ranks = group.tools.map(rank);
      expect(ranks).toEqual([...ranks].sort((left, right) => left - right));
      expect(sortMarketingNavTools(group.tools).map((tool) => tool.id)).toEqual(
        group.tools.map((tool) => tool.id),
      );
    }

    const intelligence = groups.find(
      (group) => group.category === "intelligence",
    );
    expect(intelligence?.tools[0]?.id).toBe("ocr-pdf");
    expect(
      intelligence?.tools
        .slice(1)
        .every((tool) => tool.availability === "planned"),
    ).toBe(true);
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
