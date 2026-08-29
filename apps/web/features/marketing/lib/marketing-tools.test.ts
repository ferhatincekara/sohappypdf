import { describe, expect, test } from "bun:test";
import { listRegisteredTools } from "@sohappypdf/tools/catalog";
import {
  findToolCategoryBySlug,
  getMarketingToolDirectoryGroups,
  getMarketingToolDirectoryItems,
  getMarketingToolMenuGroups,
  getMarketingToolNavGroups,
  getMarketingToolNavItems,
  getRelatedMarketingTools,
  sortMarketingNavTools,
  toolCategoryPath,
  visibleMegaMenuTools,
} from "@/features/marketing/lib/marketing-tools";

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

  test("keeps the public directory on executable tools only", () => {
    const registered = listRegisteredTools();
    const items = getMarketingToolDirectoryItems();
    const groups = getMarketingToolDirectoryGroups();

    expect(items.map((item) => item.id).sort()).toEqual(
      registered.map((tool) => tool.id).sort(),
    );
    expect(items.every((item) => item.availability !== "planned")).toBe(true);
    expect(items.some((item) => item.id === "translate-pdf")).toBe(false);
    expect(items.some((item) => item.id === "ai-summarizer")).toBe(false);
    expect(items.some((item) => item.id === "web-to-pdf")).toBe(false);
    expect(items.some((item) => item.id === "pdf-forms")).toBe(false);
    expect(items.some((item) => item.id === "image-to-pdf")).toBe(false);
    expect(
      groups.flatMap((group) => group.tools.map((tool) => tool.id)).sort(),
    ).toEqual(registered.map((tool) => tool.id).sort());
  });

  test("sorts category tools as standard, then Pro", () => {
    const rank = (tool: { availability: string; premium: boolean }) => {
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
    expect(intelligence?.tools.map((tool) => tool.id)).toEqual(["ocr-pdf"]);
  });

  test("shows planned tools in the header menu only", () => {
    const groups = getMarketingToolMenuGroups();
    const ids = groups.flatMap((group) => group.tools.map((tool) => tool.id));

    expect(ids).toContain("translate-pdf");
    expect(ids).toContain("ai-summarizer");
    expect(ids).toContain("web-to-pdf");
    expect(ids).toContain("pdf-forms");
    expect(ids).toContain("image-to-pdf");
    expect(
      groups
        .find((group) => group.category === "intelligence")
        ?.tools.map((tool) => tool.id),
    ).toEqual(["ocr-pdf", "ai-summarizer", "translate-pdf"]);
  });

  test("keeps coming soon tools visible when a menu group is full", () => {
    const convert =
      getMarketingToolMenuGroups().find((group) => group.category === "convert")
        ?.tools ?? [];
    const visible = visibleMegaMenuTools(convert);

    expect(visible.some((tool) => tool.id === "image-to-pdf")).toBe(true);
    expect(visible.filter((tool) => tool.availability === "planned")).toEqual([
      expect.objectContaining({ id: "image-to-pdf" }),
    ]);
    expect(visible.length).toBeLessThanOrEqual(6);
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
