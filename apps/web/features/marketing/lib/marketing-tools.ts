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

const RELATED_TOOL_IDS: Readonly<Record<string, readonly string[]>> = {
  "merge-pdf": ["split-pdf", "compress-pdf", "organize-pdf", "rotate-pdf"],
  "split-pdf": ["merge-pdf", "extract-pages", "organize-pdf", "remove-pages"],
  "extract-pages": ["split-pdf", "remove-pages", "organize-pdf", "merge-pdf"],
  "organize-pdf": ["rotate-pdf", "remove-pages", "split-pdf", "merge-pdf"],
  "remove-pages": ["extract-pages", "organize-pdf", "split-pdf", "rotate-pdf"],
  "reorder-pages": ["organize-pdf", "rotate-pdf", "remove-pages"],
  "rotate-pdf": ["organize-pdf", "merge-pdf", "compress-pdf"],
  "crop-pdf": ["organize-pdf", "compress-pdf", "rotate-pdf"],
  "compress-pdf": ["merge-pdf", "pdf-to-pdfa", "repair-pdf"],
  "repair-pdf": ["compress-pdf", "unlock-pdf", "ocr-pdf"],
  "pdf-to-word": [
    "word-to-pdf",
    "pdf-to-excel",
    "pdf-to-powerpoint",
    "ocr-pdf",
  ],
  "pdf-to-word-ocr": ["pdf-to-word", "ocr-pdf", "word-to-pdf"],
  "pdf-to-excel": ["excel-to-pdf", "pdf-to-word", "pdf-to-powerpoint"],
  "pdf-to-excel-ocr": ["pdf-to-excel", "ocr-pdf", "excel-to-pdf"],
  "pdf-to-powerpoint": ["powerpoint-to-pdf", "pdf-to-word", "pdf-to-excel"],
  "pdf-to-jpg": ["jpg-to-pdf", "pdf-to-png", "compress-pdf"],
  "pdf-to-png": ["png-to-pdf", "pdf-to-jpg", "compress-pdf"],
  "word-to-pdf": ["pdf-to-word", "excel-to-pdf", "powerpoint-to-pdf"],
  "excel-to-pdf": ["pdf-to-excel", "word-to-pdf", "powerpoint-to-pdf"],
  "powerpoint-to-pdf": ["pdf-to-powerpoint", "word-to-pdf", "excel-to-pdf"],
  "office-to-pdf": ["word-to-pdf", "excel-to-pdf", "powerpoint-to-pdf"],
  "jpg-to-pdf": ["pdf-to-jpg", "png-to-pdf", "merge-pdf"],
  "png-to-pdf": ["pdf-to-png", "jpg-to-pdf", "merge-pdf"],
  "edit-pdf": ["sign-pdf", "watermark-pdf", "page-numbers-pdf", "redact-pdf"],
  "watermark-pdf": ["edit-pdf", "page-numbers-pdf", "protect-pdf"],
  "page-numbers-pdf": ["watermark-pdf", "edit-pdf", "organize-pdf"],
  "protect-pdf": ["unlock-pdf", "redact-pdf", "sign-pdf"],
  "unlock-pdf": ["protect-pdf", "repair-pdf", "redact-pdf"],
  "sign-pdf": ["edit-pdf", "protect-pdf", "watermark-pdf"],
  "redact-pdf": ["protect-pdf", "unlock-pdf", "sign-pdf", "edit-pdf"],
  "compare-pdf": ["merge-pdf", "organize-pdf", "pdf-to-word"],
  "ocr-pdf": ["pdf-to-word", "pdf-to-txt", "scan-to-pdf"],
  "scan-to-pdf": ["ocr-pdf", "jpg-to-pdf", "png-to-pdf"],
  "pdf-to-txt": ["ocr-pdf", "pdf-to-word", "pdf-to-markdown"],
  "pdf-to-markdown": ["pdf-to-txt", "pdf-to-word", "ocr-pdf"],
  "pdf-extract": ["pdf-to-txt", "ocr-pdf", "pdf-to-markdown"],
  "pdf-to-pdfa": ["compress-pdf", "repair-pdf", "protect-pdf"],
};

export function getRelatedMarketingTools(
  tool: ToolDefinition,
  limit = 4,
): readonly MarketingToolNavItem[] {
  const items = getMarketingToolNavItems();
  const byId = new Map(items.map((item) => [item.id, item]));
  const preferred = (RELATED_TOOL_IDS[tool.id] ?? [])
    .map((id) => byId.get(id))
    .filter((item): item is MarketingToolNavItem => item !== undefined);
  const fallback = items.filter(
    (item) =>
      item.id !== tool.id &&
      item.category === tool.category &&
      !preferred.some((preferredItem) => preferredItem.id === item.id),
  );

  return [...preferred, ...fallback].slice(0, limit);
}
