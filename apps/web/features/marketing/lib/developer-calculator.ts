import {
  listRegisteredTools,
  TOOL_CATEGORIES,
  type ToolCategory,
} from "@repo/tools/catalog";

export function tasksForCredits(
  credits: number,
  apiCreditCost: number,
): number {
  if (apiCreditCost < 1) {
    return 0;
  }

  return Math.floor(credits / apiCreditCost);
}

export type DeveloperCalculatorTool = {
  id: string;
  category: ToolCategory;
  apiCreditCost: number;
};

export type DeveloperCalculatorToolGroup = {
  category: ToolCategory;
  tools: readonly DeveloperCalculatorTool[];
};

export function listDeveloperCalculatorTools(): readonly DeveloperCalculatorTool[] {
  return listRegisteredTools()
    .filter((tool) => tool.apiCreditCost > 0)
    .map((tool) => ({
      id: tool.id,
      category: tool.category,
      apiCreditCost: tool.apiCreditCost,
    }));
}

export function groupDeveloperCalculatorTools(
  tools: readonly DeveloperCalculatorTool[],
): readonly DeveloperCalculatorToolGroup[] {
  return TOOL_CATEGORIES.flatMap((category) => {
    const grouped = tools.filter((tool) => tool.category === category);

    if (grouped.length === 0) {
      return [];
    }

    return [{ category, tools: grouped }];
  });
}

export function snapCreditIndex(index: number, packCount: number): number {
  if (packCount < 1) {
    return 0;
  }

  return Math.min(packCount - 1, Math.max(0, Math.round(index)));
}
