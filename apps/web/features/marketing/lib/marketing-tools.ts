import {
  listRegisteredTools,
  type ToolDefinition,
  toolPublicPath,
} from "@repo/tools/catalog";

export const MARKETING_TOOL_CATEGORY_ORDER = [
  "convert",
  "organize",
  "optimize",
  "edit",
  "secure",
  "ai",
] as const;

export type MarketingToolCategory =
  (typeof MARKETING_TOOL_CATEGORY_ORDER)[number];

export type MarketingToolNavItem = {
  id: ToolDefinition["id"];
  href: ReturnType<typeof toolPublicPath>;
  category: ToolDefinition["category"];
};

export type MarketingToolNavGroup = {
  category: MarketingToolCategory;
  tools: readonly MarketingToolNavItem[];
};

export function getMarketingToolNavItems(): readonly MarketingToolNavItem[] {
  return listRegisteredTools().map((tool) => ({
    id: tool.id,
    href: toolPublicPath(tool.id),
    category: tool.category,
  }));
}

export function getMarketingToolNavGroups(): readonly MarketingToolNavGroup[] {
  const items = getMarketingToolNavItems();

  return MARKETING_TOOL_CATEGORY_ORDER.flatMap((category) => {
    const tools = items.filter((item) => item.category === category);

    if (tools.length === 0) {
      return [];
    }

    return [{ category, tools }];
  });
}
