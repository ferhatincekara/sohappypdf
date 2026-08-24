import type { ToolCategory } from "./tool-category.js";
import type { ToolId } from "./tool-id.js";
import type { ToolIoKind } from "./tool-io.js";
import type { ToolPlanId } from "./tool-plan.js";

export type ToolDefinition = {
  id: ToolId;
  category: ToolCategory;
  nameKey: string;
  descriptionKey: string;
  inputKind: ToolIoKind;
  outputKind: ToolIoKind;
  inputFormats: readonly string[];
  outputFormats: readonly string[];
  allowsAnonymous: boolean;
  requiresAuthentication: boolean;
  availableOnPlans: readonly ToolPlanId[];
  creditCost: number;
  maxFileSizeBytes: number | null;
  maxInputCount: number;
  processorId: string;
};
