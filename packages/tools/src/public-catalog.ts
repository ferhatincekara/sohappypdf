/**
 * Turbopack-safe leaf module for `@repo/tools/catalog`.
 * Keep this file free of relative imports so Next can resolve it.
 */

export const TOOL_AVAILABILITIES = ["planned", "available", "beta"] as const;
export type ToolAvailability = (typeof TOOL_AVAILABILITIES)[number];

export function isToolAvailability(value: string): value is ToolAvailability {
  return TOOL_AVAILABILITIES.some((availability) => availability === value);
}

export function isExecutableToolAvailability(
  availability: ToolAvailability,
): boolean {
  return availability === "available" || availability === "beta";
}

export const TOOL_CATEGORIES = [
  "organize",
  "optimize",
  "convert",
  "edit",
  "security",
  "document",
  "intelligence",
] as const;
export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export function isToolCategory(value: string): value is ToolCategory {
  return TOOL_CATEGORIES.some((category) => category === value);
}

export const TOOL_IO_KINDS = [
  "pdf",
  "image",
  "office",
  "text",
  "mixed",
] as const;
export type ToolIoKind = (typeof TOOL_IO_KINDS)[number];

export function isToolIoKind(value: string): value is ToolIoKind {
  return TOOL_IO_KINDS.some((kind) => kind === value);
}

export const TOOL_PLANS = ["free", "pro"] as const;
export type ToolPlanId = (typeof TOOL_PLANS)[number];

export function isToolPlanId(value: string): value is ToolPlanId {
  return TOOL_PLANS.some((plan) => plan === value);
}

export type ToolDefinition = {
  id: string;
  category: ToolCategory;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  route: `/${string}`;
  inputKind: ToolIoKind;
  outputKind: ToolIoKind;
  inputFormats: readonly string[];
  outputFormats: readonly string[];
  allowsAnonymous: boolean;
  requiresAuthentication: boolean;
  availableOnPlans: readonly ToolPlanId[];
  maxFileSizeBytes: number | null;
  maxInputCount: number;
  webCreditCost: number;
  apiCreditCost: number;
  aiCreditCost: number;
  availability: ToolAvailability;
  processorId: string;
};

/**
 * Centralized per-tool credit pricing.
 * Web and API costs are independent — do not assume they are equal.
 *
 * Initial web weights (estimates only):
 * - 1: organize / light edit
 * - 2: compress / crop / protect / unlock / repair
 * - 5: OCR and office document conversions
 * - 10: advanced OCR / extraction
 */
export const TOOL_CREDIT_PRICING = {
  "merge-pdf": { webCreditCost: 1, apiCreditCost: 1 },
  "split-pdf": { webCreditCost: 1, apiCreditCost: 1 },
  "organize-pdf": { webCreditCost: 1, apiCreditCost: 1 },
  "remove-pages": { webCreditCost: 1, apiCreditCost: 1 },
  "reorder-pages": { webCreditCost: 1, apiCreditCost: 1 },
  "rotate-pdf": { webCreditCost: 1, apiCreditCost: 1 },
  "crop-pdf": { webCreditCost: 2, apiCreditCost: 2 },
  "compress-pdf": { webCreditCost: 2, apiCreditCost: 2 },
  "repair-pdf": { webCreditCost: 2, apiCreditCost: 2 },
  "pdf-to-pdfa": { webCreditCost: 5, apiCreditCost: 5 },
  "pdf-to-word": { webCreditCost: 5, apiCreditCost: 5 },
  "pdf-to-word-ocr": { webCreditCost: 10, apiCreditCost: 12 },
  "pdf-to-powerpoint": { webCreditCost: 5, apiCreditCost: 5 },
  "pdf-to-excel": { webCreditCost: 5, apiCreditCost: 5 },
  "pdf-to-excel-ocr": { webCreditCost: 10, apiCreditCost: 12 },
  "pdf-to-jpg": { webCreditCost: 1, apiCreditCost: 1 },
  "pdf-to-png": { webCreditCost: 1, apiCreditCost: 1 },
  "pdf-to-txt": { webCreditCost: 1, apiCreditCost: 1 },
  "word-to-pdf": { webCreditCost: 2, apiCreditCost: 2 },
  "powerpoint-to-pdf": { webCreditCost: 2, apiCreditCost: 2 },
  "excel-to-pdf": { webCreditCost: 2, apiCreditCost: 2 },
  "image-to-pdf": { webCreditCost: 1, apiCreditCost: 1 },
  "jpg-to-pdf": { webCreditCost: 1, apiCreditCost: 1 },
  "png-to-pdf": { webCreditCost: 1, apiCreditCost: 1 },
  "office-to-pdf": { webCreditCost: 2, apiCreditCost: 2 },
  "edit-pdf": { webCreditCost: 5, apiCreditCost: 5 },
  "watermark-pdf": { webCreditCost: 1, apiCreditCost: 1 },
  "page-numbers-pdf": { webCreditCost: 1, apiCreditCost: 1 },
  "protect-pdf": { webCreditCost: 2, apiCreditCost: 2 },
  "unlock-pdf": { webCreditCost: 2, apiCreditCost: 2 },
  "sign-pdf": { webCreditCost: 5, apiCreditCost: 5 },
  "redact-pdf": { webCreditCost: 5, apiCreditCost: 6 },
  "compare-pdf": { webCreditCost: 5, apiCreditCost: 5 },
  "pdf-forms": { webCreditCost: 5, apiCreditCost: 5 },
  "web-to-pdf": { webCreditCost: 2, apiCreditCost: 3 },
  "scan-to-pdf": { webCreditCost: 2, apiCreditCost: 2 },
  "pdf-extract": { webCreditCost: 10, apiCreditCost: 12 },
  "pdf-to-markdown": { webCreditCost: 5, apiCreditCost: 5 },
  "ocr-pdf": { webCreditCost: 5, apiCreditCost: 5 },
  "ai-summarizer": { webCreditCost: 0, apiCreditCost: 0, aiCreditCost: 10 },
  "translate-pdf": { webCreditCost: 0, apiCreditCost: 0, aiCreditCost: 10 },
} as const;

export type PricedToolId = keyof typeof TOOL_CREDIT_PRICING;
export type ToolCreditPricing = {
  webCreditCost: number;
  apiCreditCost: number;
  aiCreditCost: number;
};

type ToolCreditPricingInput = {
  webCreditCost: number;
  apiCreditCost: number;
  aiCreditCost?: number;
};

export function getToolCreditPricing(toolId: PricedToolId): ToolCreditPricing {
  const pricing = TOOL_CREDIT_PRICING[toolId] as ToolCreditPricingInput;
  return {
    webCreditCost: pricing.webCreditCost,
    apiCreditCost: pricing.apiCreditCost,
    aiCreditCost: pricing.aiCreditCost ?? 0,
  };
}

const ALL_PLANS = ["free", "pro"] as const satisfies readonly ToolPlanId[];

type DefineToolInput = {
  category: ToolCategory;
  icon: string;
  inputKind: ToolIoKind;
  outputKind: ToolIoKind;
  inputFormats: readonly string[];
  outputFormats: readonly string[];
  allowsAnonymous: boolean;
  requiresAuthentication: boolean;
  availableOnPlans?: readonly ToolPlanId[];
  maxFileSizeBytes?: number | null;
  maxInputCount: number;
  availability: ToolAvailability;
  processorId: string;
};

function defineTool<const Id extends PricedToolId>(
  id: Id,
  definition: DefineToolInput,
): ToolDefinition & { id: Id; route: `/${Id}` } {
  const pricing = getToolCreditPricing(id);

  return {
    id,
    nameKey: `tools.${id}.name`,
    descriptionKey: `tools.${id}.description`,
    icon: definition.icon,
    route: `/${id}` as `/${Id}`,
    category: definition.category,
    inputKind: definition.inputKind,
    outputKind: definition.outputKind,
    inputFormats: definition.inputFormats,
    outputFormats: definition.outputFormats,
    allowsAnonymous: definition.allowsAnonymous,
    requiresAuthentication: definition.requiresAuthentication,
    availableOnPlans: definition.availableOnPlans ?? ALL_PLANS,
    maxFileSizeBytes: definition.maxFileSizeBytes ?? null,
    maxInputCount: definition.maxInputCount,
    webCreditCost: pricing.webCreditCost,
    apiCreditCost: pricing.apiCreditCost,
    aiCreditCost: pricing.aiCreditCost,
    availability: definition.availability,
    processorId: definition.processorId,
  };
}

export const TOOL_CATALOG = [
  // Organize
  defineTool("merge-pdf", {
    category: "organize",
    icon: "merge",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 21,
    availability: "available",
    processorId: "pdf-manipulate",
  }),
  defineTool("split-pdf", {
    category: "organize",
    icon: "split",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-manipulate",
  }),
  defineTool("organize-pdf", {
    category: "organize",
    icon: "layout-list",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-manipulate",
  }),
  defineTool("remove-pages", {
    category: "organize",
    icon: "file-minus",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-manipulate",
  }),
  defineTool("reorder-pages", {
    category: "organize",
    icon: "arrow-up-down",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-manipulate",
  }),
  defineTool("rotate-pdf", {
    category: "organize",
    icon: "rotate-cw",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-manipulate",
  }),
  defineTool("crop-pdf", {
    category: "organize",
    icon: "crop",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-manipulate",
  }),

  // Optimize
  defineTool("compress-pdf", {
    category: "optimize",
    icon: "minimize-2",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-manipulate",
  }),
  defineTool("repair-pdf", {
    category: "optimize",
    icon: "wrench",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-repair",
  }),
  defineTool("pdf-to-pdfa", {
    category: "optimize",
    icon: "badge-check",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-pdfa",
  }),

  // Convert
  defineTool("pdf-to-word", {
    category: "convert",
    icon: "file-type",
    inputKind: "pdf",
    outputKind: "office",
    inputFormats: ["pdf"],
    outputFormats: ["docx"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "office",
  }),
  defineTool("pdf-to-word-ocr", {
    category: "convert",
    icon: "file-scan",
    inputKind: "pdf",
    outputKind: "office",
    inputFormats: ["pdf"],
    outputFormats: ["docx"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "office-ocr",
  }),
  defineTool("pdf-to-powerpoint", {
    category: "convert",
    icon: "presentation",
    inputKind: "pdf",
    outputKind: "office",
    inputFormats: ["pdf"],
    outputFormats: ["pptx"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "office",
  }),
  defineTool("pdf-to-excel", {
    category: "convert",
    icon: "table",
    inputKind: "pdf",
    outputKind: "office",
    inputFormats: ["pdf"],
    outputFormats: ["xlsx"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "office",
  }),
  defineTool("pdf-to-excel-ocr", {
    category: "convert",
    icon: "table-2",
    inputKind: "pdf",
    outputKind: "office",
    inputFormats: ["pdf"],
    outputFormats: ["xlsx"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "office-ocr",
  }),
  defineTool("pdf-to-jpg", {
    category: "convert",
    icon: "image",
    inputKind: "pdf",
    outputKind: "image",
    inputFormats: ["pdf"],
    outputFormats: ["jpg"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-image",
  }),
  defineTool("pdf-to-png", {
    category: "convert",
    icon: "image",
    inputKind: "pdf",
    outputKind: "image",
    inputFormats: ["pdf"],
    outputFormats: ["png"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-image",
  }),
  defineTool("pdf-to-txt", {
    category: "convert",
    icon: "file-text",
    inputKind: "pdf",
    outputKind: "text",
    inputFormats: ["pdf"],
    outputFormats: ["txt"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-text",
  }),
  defineTool("word-to-pdf", {
    category: "convert",
    icon: "file-output",
    inputKind: "office",
    outputKind: "pdf",
    inputFormats: ["doc", "docx"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "office",
  }),
  defineTool("powerpoint-to-pdf", {
    category: "convert",
    icon: "file-output",
    inputKind: "office",
    outputKind: "pdf",
    inputFormats: ["ppt", "pptx"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "office",
  }),
  defineTool("excel-to-pdf", {
    category: "convert",
    icon: "file-output",
    inputKind: "office",
    outputKind: "pdf",
    inputFormats: ["xls", "xlsx"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "office",
  }),
  defineTool("image-to-pdf", {
    category: "convert",
    icon: "images",
    inputKind: "image",
    outputKind: "pdf",
    inputFormats: ["jpg", "png", "webp"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 20,
    availability: "planned",
    processorId: "image-pdf",
  }),
  defineTool("jpg-to-pdf", {
    category: "convert",
    icon: "image-plus",
    inputKind: "image",
    outputKind: "pdf",
    inputFormats: ["jpg"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "image-pdf",
  }),
  defineTool("png-to-pdf", {
    category: "convert",
    icon: "image-plus",
    inputKind: "image",
    outputKind: "pdf",
    inputFormats: ["png"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "image-pdf",
  }),
  defineTool("office-to-pdf", {
    category: "convert",
    icon: "files",
    inputKind: "office",
    outputKind: "pdf",
    inputFormats: ["doc", "docx", "ppt", "pptx", "xls", "xlsx"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "office",
  }),

  // Edit
  defineTool("edit-pdf", {
    category: "edit",
    icon: "pen-line",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 2,
    availability: "available",
    processorId: "pdf-edit",
  }),
  defineTool("watermark-pdf", {
    category: "edit",
    icon: "droplet",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-edit",
  }),
  defineTool("page-numbers-pdf", {
    category: "edit",
    icon: "hash",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-edit",
  }),

  // Security
  defineTool("protect-pdf", {
    category: "security",
    icon: "lock",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-security",
  }),
  defineTool("unlock-pdf", {
    category: "security",
    icon: "lock-open",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-security",
  }),
  defineTool("sign-pdf", {
    category: "security",
    icon: "signature",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 2,
    availability: "available",
    processorId: "pdf-edit",
  }),
  defineTool("redact-pdf", {
    category: "security",
    icon: "eye-off",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-redact",
  }),
  defineTool("compare-pdf", {
    category: "security",
    icon: "git-compare",
    inputKind: "pdf",
    outputKind: "mixed",
    inputFormats: ["pdf"],
    outputFormats: ["txt"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 2,
    availability: "available",
    processorId: "pdf-compare",
  }),
  defineTool("pdf-forms", {
    category: "security",
    icon: "form-input",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-forms",
  }),

  // Document
  defineTool("web-to-pdf", {
    category: "document",
    icon: "globe",
    inputKind: "text",
    outputKind: "pdf",
    inputFormats: ["url"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "planned",
    processorId: "web-capture",
  }),
  defineTool("scan-to-pdf", {
    category: "document",
    icon: "scan",
    inputKind: "image",
    outputKind: "pdf",
    inputFormats: ["jpg", "png"],
    outputFormats: ["pdf"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 50,
    availability: "available",
    processorId: "image-pdf",
  }),
  defineTool("pdf-extract", {
    category: "document",
    icon: "file-search",
    inputKind: "pdf",
    outputKind: "mixed",
    inputFormats: ["pdf"],
    outputFormats: ["txt", "json"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-extract",
  }),
  defineTool("pdf-to-markdown", {
    category: "document",
    icon: "file-code",
    inputKind: "pdf",
    outputKind: "text",
    inputFormats: ["pdf"],
    outputFormats: ["md"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "pdf-markdown",
  }),

  // Intelligence
  defineTool("ocr-pdf", {
    category: "intelligence",
    icon: "scan-text",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf", "txt"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    maxInputCount: 1,
    availability: "available",
    processorId: "ocr",
  }),
  defineTool("ai-summarizer", {
    category: "intelligence",
    icon: "sparkles",
    inputKind: "pdf",
    outputKind: "text",
    inputFormats: ["pdf"],
    outputFormats: ["txt", "md"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    availableOnPlans: ["pro"],
    maxInputCount: 1,
    availability: "available",
    processorId: "ai",
  }),
  defineTool("translate-pdf", {
    category: "intelligence",
    icon: "languages",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf", "txt"],
    allowsAnonymous: false,
    requiresAuthentication: true,
    availableOnPlans: ["pro"],
    maxInputCount: 1,
    availability: "available",
    processorId: "ai",
  }),
] as const satisfies readonly ToolDefinition[];

/** @deprecated Prefer TOOL_CATALOG. Alias for executable tools only. */
export const REGISTERED_TOOLS = TOOL_CATALOG.filter((tool) =>
  isExecutableToolAvailability(tool.availability),
);

export type CatalogToolDefinition = (typeof TOOL_CATALOG)[number];
export type ToolId = CatalogToolDefinition["id"];
export type RegisteredToolDefinition = (typeof REGISTERED_TOOLS)[number];

const CATALOG_TOOL_MAP = new Map<string, ToolDefinition>(
  TOOL_CATALOG.map((tool) => [tool.id, tool]),
);

const REGISTERED_TOOL_MAP = new Map<string, ToolDefinition>(
  REGISTERED_TOOLS.map((tool) => [tool.id, tool]),
);

export function listCatalogTools(): readonly ToolDefinition[] {
  return TOOL_CATALOG;
}

export function listRegisteredTools(): readonly ToolDefinition[] {
  return REGISTERED_TOOLS;
}

export function findCatalogTool(id: string): ToolDefinition | undefined {
  return CATALOG_TOOL_MAP.get(id);
}

export function findRegisteredTool(id: string): ToolDefinition | undefined {
  return REGISTERED_TOOL_MAP.get(id);
}

export function isAnonymousToolAllowed(id: string): boolean {
  const tool = findRegisteredTool(id);
  return tool?.allowsAnonymous === true;
}

export function isExecutableTool(tool: ToolDefinition): boolean {
  return isExecutableToolAvailability(tool.availability);
}

export function toolPublicPath(toolId: ToolId): `/${ToolId}` {
  const tool = findCatalogTool(toolId);

  if (tool !== undefined) {
    return tool.route as `/${ToolId}`;
  }

  return `/${toolId}`;
}

export function groupCatalogToolsByCategory(
  tools: readonly ToolDefinition[] = TOOL_CATALOG,
): readonly {
  category: ToolCategory;
  tools: readonly ToolDefinition[];
}[] {
  return TOOL_CATEGORIES.flatMap((category) => {
    const grouped = tools.filter((tool) => tool.category === category);

    if (grouped.length === 0) {
      return [];
    }

    return [{ category, tools: grouped }];
  });
}
