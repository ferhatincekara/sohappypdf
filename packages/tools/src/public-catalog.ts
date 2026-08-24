const ALL_PLANS = ["free", "pro"] as const;

function defineTool<const Id extends string>(
  id: Id,
  definition: {
    category: "organize" | "convert" | "edit" | "secure" | "optimize" | "ai";
    inputKind: "pdf" | "image" | "office" | "text" | "mixed";
    outputKind: "pdf" | "image" | "office" | "text" | "mixed";
    inputFormats: readonly string[];
    outputFormats: readonly string[];
    allowsAnonymous: boolean;
    requiresAuthentication: boolean;
    availableOnPlans: readonly ("free" | "pro")[];
    creditCost: number;
    maxFileSizeBytes: number | null;
    maxInputCount: number;
    processorId: string;
  },
) {
  return {
    id,
    nameKey: `tools.${id}.name`,
    descriptionKey: `tools.${id}.description`,
    ...definition,
  };
}

export const REGISTERED_TOOLS = [
  defineTool("pdf-to-word", {
    category: "convert",
    inputKind: "pdf",
    outputKind: "office",
    inputFormats: ["pdf"],
    outputFormats: ["docx"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    availableOnPlans: ALL_PLANS,
    creditCost: 1,
    maxFileSizeBytes: null,
    maxInputCount: 1,
    processorId: "office",
  }),
  defineTool("pdf-to-jpg", {
    category: "convert",
    inputKind: "pdf",
    outputKind: "image",
    inputFormats: ["pdf"],
    outputFormats: ["jpg"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    availableOnPlans: ALL_PLANS,
    creditCost: 1,
    maxFileSizeBytes: null,
    maxInputCount: 1,
    processorId: "pdf-image",
  }),
  defineTool("pdf-to-png", {
    category: "convert",
    inputKind: "pdf",
    outputKind: "image",
    inputFormats: ["pdf"],
    outputFormats: ["png"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    availableOnPlans: ALL_PLANS,
    creditCost: 1,
    maxFileSizeBytes: null,
    maxInputCount: 1,
    processorId: "pdf-image",
  }),
  defineTool("pdf-to-txt", {
    category: "convert",
    inputKind: "pdf",
    outputKind: "text",
    inputFormats: ["pdf"],
    outputFormats: ["txt"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    availableOnPlans: ALL_PLANS,
    creditCost: 1,
    maxFileSizeBytes: null,
    maxInputCount: 1,
    processorId: "pdf-text",
  }),
  defineTool("jpg-to-pdf", {
    category: "convert",
    inputKind: "image",
    outputKind: "pdf",
    inputFormats: ["jpg"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    availableOnPlans: ALL_PLANS,
    creditCost: 1,
    maxFileSizeBytes: null,
    maxInputCount: 1,
    processorId: "image-pdf",
  }),
  defineTool("png-to-pdf", {
    category: "convert",
    inputKind: "image",
    outputKind: "pdf",
    inputFormats: ["png"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    availableOnPlans: ALL_PLANS,
    creditCost: 1,
    maxFileSizeBytes: null,
    maxInputCount: 1,
    processorId: "image-pdf",
  }),
  defineTool("merge-pdf", {
    category: "organize",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    availableOnPlans: ALL_PLANS,
    creditCost: 1,
    maxFileSizeBytes: null,
    maxInputCount: 21,
    processorId: "pdf-manipulate",
  }),
  defineTool("split-pdf", {
    category: "organize",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    availableOnPlans: ALL_PLANS,
    creditCost: 1,
    maxFileSizeBytes: null,
    maxInputCount: 1,
    processorId: "pdf-manipulate",
  }),
  defineTool("compress-pdf", {
    category: "optimize",
    inputKind: "pdf",
    outputKind: "pdf",
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    allowsAnonymous: true,
    requiresAuthentication: false,
    availableOnPlans: ALL_PLANS,
    creditCost: 1,
    maxFileSizeBytes: null,
    maxInputCount: 1,
    processorId: "pdf-manipulate",
  }),
];

export type ToolDefinition = (typeof REGISTERED_TOOLS)[number];
export type ToolId = ToolDefinition["id"];

const REGISTERED_TOOL_MAP = new Map<string, ToolDefinition>(
  REGISTERED_TOOLS.map((tool) => [tool.id, tool]),
);

export function listRegisteredTools(): readonly ToolDefinition[] {
  return REGISTERED_TOOLS;
}

export function findRegisteredTool(id: string): ToolDefinition | undefined {
  return REGISTERED_TOOL_MAP.get(id);
}

export function isAnonymousToolAllowed(id: string): boolean {
  return findRegisteredTool(id)?.allowsAnonymous === true;
}

export function toolPublicPath(toolId: ToolId): `/${ToolId}` {
  return `/${toolId}`;
}
