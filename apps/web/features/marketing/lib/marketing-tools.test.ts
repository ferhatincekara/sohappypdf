import { describe, expect, test } from "bun:test";
import { listCatalogTools, listRegisteredTools } from "@repo/tools/catalog";
import {
  getMarketingToolDirectoryGroups,
  getMarketingToolDirectoryItems,
  getMarketingToolNavGroups,
  getMarketingToolNavItems,
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
      "optimize",
      "convert",
      "edit",
      "security",
      "document",
      "intelligence",
    ]);
    expect(
      groups.flatMap((group) => group.tools.map((tool) => tool.id)),
    ).toEqual(items.map((item) => item.id));
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
      "optimize",
      "convert",
      "edit",
      "security",
      "document",
      "intelligence",
    ]);
    expect(
      groups.flatMap((group) => group.tools.map((tool) => tool.id)).sort(),
    ).toEqual(catalog.map((tool) => tool.id).sort());
  });
});
