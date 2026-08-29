import {
  isPremiumTool,
  listRegisteredTools,
  type ToolCategory,
} from "@sohappypdf/tools/catalog";
import { conversionCreateBodyExample } from "@/features/developer-docs/lib/example-snippets";
import {
  buildConversionExampleBody,
  type ExtraFilesKind,
  getPublicApiToolGuide,
  type ToolGuideNoteId,
  type ToolOptionField,
} from "@/features/developer-docs/lib/public-api-tool-guide";

export type PublicApiTool = {
  id: string;
  category: ToolCategory;
  apiCreditCost: number;
  aiCreditCost: number;
  inputFormats: readonly string[];
  outputFormats: readonly string[];
  maxInputCount: number;
  premium: boolean;
  extraFiles: ExtraFilesKind;
  requiresExplicitType: boolean;
  fields: readonly ToolOptionField[];
  noteIds: readonly ToolGuideNoteId[];
  exampleJson: string;
};

export function listPublicApiTools(): readonly PublicApiTool[] {
  return listRegisteredTools().map((tool) => {
    const guide = getPublicApiToolGuide(tool.id);
    const targetFormat = tool.outputFormats[0] ?? "pdf";

    return {
      id: tool.id,
      category: tool.category,
      apiCreditCost: tool.apiCreditCost,
      aiCreditCost: tool.aiCreditCost,
      inputFormats: tool.inputFormats,
      outputFormats: tool.outputFormats,
      maxInputCount: tool.maxInputCount,
      premium: isPremiumTool(tool),
      extraFiles: guide.extraFiles,
      requiresExplicitType: guide.requiresExplicitType,
      fields: guide.fields,
      noteIds: guide.noteIds,
      exampleJson: conversionCreateBodyExample(
        buildConversionExampleBody({
          toolId: tool.id,
          targetFormat,
        }),
      ),
    };
  });
}

export function listPublicApiToolCategories(
  tools: readonly PublicApiTool[],
): readonly ToolCategory[] {
  const seen = new Set<ToolCategory>();
  const categories: ToolCategory[] = [];

  for (const tool of tools) {
    if (!seen.has(tool.category)) {
      seen.add(tool.category);
      categories.push(tool.category);
    }
  }

  return categories;
}
