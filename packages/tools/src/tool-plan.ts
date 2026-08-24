export const TOOL_PLANS = ["free", "pro"] as const;

export type ToolPlanId = (typeof TOOL_PLANS)[number];

export function isToolPlanId(value: string): value is ToolPlanId {
  return TOOL_PLANS.some((plan) => plan === value);
}
