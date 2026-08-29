import {
  isPremiumTool,
  listCatalogTools,
  listRegisteredTools,
  type ToolDefinition,
} from "@sohappypdf/tools/catalog";

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

export const MARKETING_TOOL_CATEGORY_SLUGS = {
  organize: "organize-pdf",
  convert: "convert-pdf",
  edit: "edit-pdf",
  optimize: "optimize-pdf",
  security: "security",
  document: "images",
  intelligence: "ocr",
} as const satisfies Record<MarketingToolCategory, string>;

export type MarketingToolCategorySlug =
  (typeof MARKETING_TOOL_CATEGORY_SLUGS)[MarketingToolCategory];

const CATEGORY_BY_SLUG = new Map<string, MarketingToolCategory>(
  MARKETING_TOOL_CATEGORY_ORDER.map((category) => [
    MARKETING_TOOL_CATEGORY_SLUGS[category],
    category,
  ]),
);

export function toolCategoryPath(
  category: MarketingToolCategory,
): `/tools/${MarketingToolCategorySlug}` {
  return `/tools/${MARKETING_TOOL_CATEGORY_SLUGS[category]}`;
}

export function findToolCategoryBySlug(
  slug: string,
): MarketingToolCategory | undefined {
  return CATEGORY_BY_SLUG.get(slug);
}

export type MarketingToolNavItem = {
  id: ToolDefinition["id"];
  href: ToolDefinition["route"];
  category: ToolDefinition["category"];
  availability: ToolDefinition["availability"];
  icon: ToolDefinition["icon"];
  premium: boolean;
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
    icon: tool.icon,
    premium: isPremiumTool(tool),
  };
}

function marketingToolRank(tool: MarketingToolNavItem): number {
  if (tool.availability === "planned") {
    return 2;
  }

  if (tool.premium) {
    return 1;
  }

  return 0;
}

export function sortMarketingNavTools(
  tools: readonly MarketingToolNavItem[],
): MarketingToolNavItem[] {
  return [...tools].sort(
    (left, right) => marketingToolRank(left) - marketingToolRank(right),
  );
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

    return [{ category, tools: sortMarketingNavTools(tools) }];
  });
}

/** Live public directory — planned catalog entries stay off /tools pages. */
export function getMarketingToolDirectoryItems(): readonly MarketingToolNavItem[] {
  return getMarketingToolNavItems();
}

export function getMarketingToolDirectoryGroups(): readonly MarketingToolNavGroup[] {
  return getMarketingToolNavGroups();
}

const MEGA_MENU_TOOL_LIMIT = 6;

/** Header menu can preview planned tools; they stay unlinked. */
export function getMarketingToolMenuGroups(): readonly MarketingToolNavGroup[] {
  const items = listCatalogTools().map(toNavItem);

  return MARKETING_TOOL_CATEGORY_ORDER.flatMap((category) => {
    const tools = items.filter((item) => item.category === category);

    if (tools.length === 0) {
      return [];
    }

    return [{ category, tools: sortMarketingNavTools(tools) }];
  });
}

export function visibleMegaMenuTools(
  tools: readonly MarketingToolNavItem[],
  limit = MEGA_MENU_TOOL_LIMIT,
): MarketingToolNavItem[] {
  const planned = tools.filter((tool) => tool.availability === "planned");
  const live = tools.filter((tool) => tool.availability !== "planned");
  const liveLimit = Math.max(0, limit - planned.length);

  return [...live.slice(0, liveLimit), ...planned];
}

export function getRelatedMarketingTools(
  tool: ToolDefinition,
  limit = 4,
): readonly MarketingToolNavItem[] {
  return getMarketingToolNavItems()
    .filter((item) => item.category === tool.category && item.id !== tool.id)
    .slice(0, limit);
}
