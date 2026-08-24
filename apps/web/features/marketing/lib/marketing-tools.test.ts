import { describe, expect, test } from "bun:test";
import { listRegisteredTools } from "@repo/tools/catalog";
import {
  getMarketingToolNavGroups,
  getMarketingToolNavItems,
} from "./marketing-tools";

describe("marketing tool navigation", () => {
  test("lists every registered public tool path", () => {
    const registered = listRegisteredTools();
    const items = getMarketingToolNavItems();

    expect(items.map((item) => item.id)).toEqual(
      registered.map((tool) => tool.id),
    );
    expect(items.map((item) => item.href)).toEqual(
      registered.map((tool) => `/${tool.id}`),
    );
  });

  test("groups tools by category without dropping any", () => {
    const items = getMarketingToolNavItems();
    const groups = getMarketingToolNavGroups();

    expect(groups.map((group) => group.category)).toEqual([
      "convert",
      "organize",
      "optimize",
    ]);
    expect(
      groups.flatMap((group) => group.tools.map((tool) => tool.id)),
    ).toEqual(items.map((item) => item.id));
  });
});
