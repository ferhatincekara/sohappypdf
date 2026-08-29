import { describe, expect, test } from "bun:test";
import { listRegisteredTools } from "@sohappypdf/tools/catalog";
import {
  buildConversionExampleBody,
  listGuidedToolIds,
} from "@/features/developer-docs/lib/public-api-tool-guide";
import { listPublicApiTools } from "@/features/developer-docs/lib/public-api-tools";
import { getMarketingToolDirectoryItems } from "@/features/marketing/lib/marketing-tools";

describe("public API tools", () => {
  test("lists executable registered tools with API credit costs", () => {
    const tools = listPublicApiTools();
    const registered = listRegisteredTools();

    expect(tools.length).toBeGreaterThan(0);
    expect(tools.map((tool) => tool.id)).toEqual(
      registered.map((tool) => tool.id),
    );
    expect(tools.some((tool) => tool.id === "translate-pdf")).toBe(false);
    expect(tools.some((tool) => tool.id === "ai-summarizer")).toBe(false);
    expect(tools.some((tool) => tool.id === "web-to-pdf")).toBe(false);
    expect(tools.some((tool) => tool.id === "pdf-forms")).toBe(false);
    expect(tools.some((tool) => tool.id === "image-to-pdf")).toBe(false);
    expect(tools.map((tool) => tool.id)).toEqual(
      getMarketingToolDirectoryItems().map((item) => item.id),
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
