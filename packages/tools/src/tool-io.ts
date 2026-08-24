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
