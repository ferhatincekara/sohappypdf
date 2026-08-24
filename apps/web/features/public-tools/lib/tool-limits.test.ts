import { describe, expect, test } from "bun:test";
import { findRegisteredTool } from "@repo/tools/catalog";
import { maxFilesForTool } from "./tool-limits";

describe("maxFilesForTool", () => {
  test("caps anonymous merge below the authenticated tool maximum", () => {
    const merge = findRegisteredTool("merge-pdf");

    expect(merge).toBeDefined();
    if (merge === undefined) {
      throw new Error("merge-pdf must be registered");
    }

    expect(maxFilesForTool(merge, true)).toBe(5);
    expect(maxFilesForTool(merge, false)).toBe(21);
  });
});
