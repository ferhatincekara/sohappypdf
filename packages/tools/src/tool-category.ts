export const TOOL_CATEGORIES = [
  "organize",
  "convert",
  "edit",
  "secure",
  "optimize",
  "ai",
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export function isToolCategory(value: string): value is ToolCategory {
  return TOOL_CATEGORIES.some((category) => category === value);
}
