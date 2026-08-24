import type { ToolExecutionStatus } from "./tool-execution-status.js";
import type { ToolId } from "./tool-id.js";

export type ToolExecution = {
  id: string;
  toolId: ToolId;
  userId: string | null;
  anonymousSessionId: string | null;
  status: ToolExecutionStatus;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date | null;
  errorCode: string | null;
  metadata: Readonly<Record<string, unknown>>;
  inputFileIds: readonly string[];
  outputFileIds: readonly string[];
};
