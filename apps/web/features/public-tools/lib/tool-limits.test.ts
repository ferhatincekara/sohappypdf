import { describe, expect, test } from "bun:test";
import { DEFAULT_PLAN_LIMITS } from "@repo/billing/plans";
import { findRegisteredTool } from "@repo/tools/catalog";
import { maxFilesForTool } from "./tool-limits";

describe("maxFilesForTool", () => {
  test("lets merge pick the tool file count on every web tier", () => {
    const merge = findRegisteredTool("merge-pdf");

    expect(merge).toBeDefined();
    if (merge === undefined) {
      throw new Error("merge-pdf must be registered");
    }

    expect(maxFilesForTool(merge, { anonymous: true })).toBe(21);
    expect(
      maxFilesForTool(merge, {
        anonymous: false,
        maxFilesPerOperation: DEFAULT_PLAN_LIMITS.free.maxFilesPerOperation,
      }),
    ).toBe(21);
    expect(
      maxFilesForTool(merge, {
        anonymous: false,
        maxFilesPerOperation: DEFAULT_PLAN_LIMITS.pro.maxFilesPerOperation,
      }),
    ).toBe(21);
  });

  test("keeps single-file tools at one file unless Pro can batch", () => {
    const compress = findRegisteredTool("compress-pdf");

    expect(compress).toBeDefined();
    if (compress === undefined) {
      throw new Error("compress-pdf must be registered");
    }

    expect(maxFilesForTool(compress, { anonymous: true })).toBe(1);
    expect(
      maxFilesForTool(compress, {
        anonymous: false,
        maxFilesPerOperation: DEFAULT_PLAN_LIMITS.free.maxFilesPerOperation,
      }),
    ).toBe(1);
    expect(
      maxFilesForTool(compress, {
        anonymous: false,
        maxFilesPerOperation: DEFAULT_PLAN_LIMITS.pro.maxFilesPerOperation,
      }),
    ).toBe(20);
  });
});
