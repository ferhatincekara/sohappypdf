import { describe, expect, test } from "bun:test";
import { listRegisteredTools } from "@repo/tools/catalog";
import {
  buildConversionExampleBody,
  listGuidedToolIds,
} from "./public-api-tool-guide";
import { listPublicApiTools } from "./public-api-tools";

describe("public API tools", () => {
  test("lists executable registered tools with API credit costs", () => {
    const tools = listPublicApiTools();
    const registered = listRegisteredTools();

    expect(tools.length).toBeGreaterThan(0);
    expect(tools.map((tool) => tool.id)).toEqual(
      registered.map((tool) => tool.id),
    );
  });

  test("documents every registered tool with a conversion body", () => {
    const registeredIds = listRegisteredTools().map((tool) => tool.id);
    const guided = new Set(listGuidedToolIds());

    expect(registeredIds.every((id) => guided.has(id))).toBe(true);

    const merge = listPublicApiTools().find((tool) => tool.id === "merge-pdf");

    expect(merge?.exampleJson).toContain("additionalFileIds");
    expect(merge?.exampleJson).toContain("merge-pdf");
    expect(
      buildConversionExampleBody({
        toolId: "compress-pdf",
        targetFormat: "pdf",
      }).options,
    ).toEqual({ level: "medium" });
  });
});
