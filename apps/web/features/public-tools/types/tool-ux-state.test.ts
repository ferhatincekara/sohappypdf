import { describe, expect, test } from "bun:test";
import { resolveToolWorkspaceErrorKey } from "@/features/public-tools/types/tool-ux-state";

describe("tool workspace error key", () => {
  test("reads the blocking error from selected and failed workspace states", () => {
    expect(
      resolveToolWorkspaceErrorKey({
        status: "selected",
        files: [],
        error: { key: "tooManyPages", retryable: false },
      }),
    ).toBe("tooManyPages");
    expect(
      resolveToolWorkspaceErrorKey({
        status: "error",
        executionId: null,
        error: { key: "processingFailed", retryable: true },
      }),
    ).toBe("processingFailed");
    expect(resolveToolWorkspaceErrorKey({ status: "empty" })).toBeNull();
  });
});
