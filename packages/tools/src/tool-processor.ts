import type { ToolId } from "./tool-id.js";

export type ToolProcessorContext = {
  executionId: string;
  toolId: ToolId;
  inputPaths: readonly string[];
  outputDirectory: string;
  sourceFormat: string;
  targetFormat: string;
  options: Readonly<Record<string, unknown>>;
};

export type ToolProcessorResult = {
  outputPath: string;
  mimeType: string;
  filename: string;
};

export type ToolProcessor = {
  readonly id: string;
  readonly toolIds: readonly ToolId[];
  canProcess(toolId: ToolId): boolean;
  process(context: ToolProcessorContext): Promise<ToolProcessorResult>;
};

export type ToolProcessorQuery = {
  toolId: ToolId;
  sourceFormat: string;
  targetFormat: string;
};

export type ToolProcessorRegistry = {
  resolve(query: ToolProcessorQuery): ToolProcessor;
};
