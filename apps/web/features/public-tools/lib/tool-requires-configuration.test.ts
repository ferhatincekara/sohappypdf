import { describe, expect, test } from "bun:test";
import { toolRequiresConfiguration } from "./tool-requires-configuration";

describe("toolRequiresConfiguration", () => {
  test("treats dedicated option workspaces as configuring", () => {
    expect(toolRequiresConfiguration("merge-pdf")).toBe(true);
    expect(toolRequiresConfiguration("protect-pdf")).toBe(true);
    expect(toolRequiresConfiguration("page-numbers-pdf")).toBe(true);
  });

  test("keeps simple process-only tools in the selected state", () => {
    expect(toolRequiresConfiguration("repair-pdf")).toBe(false);
    expect(toolRequiresConfiguration("jpg-to-pdf")).toBe(false);
    expect(toolRequiresConfiguration("pdf-to-jpg")).toBe(false);
  });
});
