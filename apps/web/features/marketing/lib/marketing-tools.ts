import {
  groupCatalogToolsByCategory,
  listCatalogTools,
  listRegisteredTools,
  type ToolDefinition,
} from "@repo/tools/catalog";

export const MARKETING_TOOL_CATEGORY_ORDER = [
  "organize",
  "convert",
  "edit",
  "optimize",
  "security",
  "document",
  "intelligence",
] as const;

export type MarketingToolCategory =
  (typeof MARKETING_TOOL_CATEGORY_ORDER)[number];

export type MarketingToolNavItem = {
  id: ToolDefinition["id"];
  href: ToolDefinition["route"];
  category: ToolDefinition["category"];
  availability: ToolDefinition["availability"];
};

export type MarketingToolNavGroup = {
  category: MarketingToolCategory;
  tools: readonly MarketingToolNavItem[];
};

function toNavItem(tool: ToolDefinition): MarketingToolNavItem {
  return {
    id: tool.id,
    href: tool.route,
    category: tool.category,
    availability: tool.availability,
  };
}

/** Executable tools only — safe for live public routes. */
export function getMarketingToolNavItems(): readonly MarketingToolNavItem[] {
  return listRegisteredTools().map(toNavItem);
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

/** Full metadata-driven directory, including planned tools. */
export function getMarketingToolDirectoryItems(): readonly MarketingToolNavItem[] {
  return listCatalogTools().map(toNavItem);
}

export function getMarketingToolDirectoryGroups(): readonly MarketingToolNavGroup[] {
  const grouped = new Map(
    groupCatalogToolsByCategory().map((group) => [
      group.category,
      group.tools.map(toNavItem),
    ]),
  );

  return MARKETING_TOOL_CATEGORY_ORDER.flatMap((category) => {
    const tools = grouped.get(category);

    if (tools === undefined || tools.length === 0) {
      return [];
    }

    return [{ category, tools }];
  });
}

export function getRelatedMarketingTools(
  tool: ToolDefinition,
  limit = 4,
): readonly MarketingToolNavItem[] {
  return getMarketingToolNavItems()
    .filter((item) => item.category === tool.category && item.id !== tool.id)
    .slice(0, limit);
}
