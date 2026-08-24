import { describe, expect, test } from "bun:test";
import {
  findCatalogTool,
  findRegisteredTool,
  groupCatalogToolsByCategory,
  isAnonymousToolAllowed,
  isExecutableTool,
  isRegisteredToolId,
  listCatalogTools,
  listRegisteredTools,
  REGISTERED_TOOLS,
  TOOL_CATALOG,
} from "./index.js";
import { TOOL_CREDIT_PRICING } from "./tool-credit-pricing.js";
import { toolPublicPath } from "./tool-path.js";
import { isLiveProcessorId } from "./tool-processor-ids.js";

describe("tool catalog", () => {
  test("has unique tool ids", () => {
    const ids = TOOL_CATALOG.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("has unique routes", () => {
    const routes = TOOL_CATALOG.map((tool) => tool.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  test("covers the product catalog without duplicates", () => {
    expect(TOOL_CATALOG.map((tool) => tool.id)).toEqual([
      "merge-pdf",
      "split-pdf",
      "organize-pdf",
      "remove-pages",
      "reorder-pages",
      "rotate-pdf",
      "crop-pdf",
      "compress-pdf",
      "repair-pdf",
      "pdf-to-pdfa",
      "pdf-to-word",
      "pdf-to-word-ocr",
      "pdf-to-powerpoint",
      "pdf-to-excel",
      "pdf-to-excel-ocr",
      "pdf-to-jpg",
      "pdf-to-png",
      "pdf-to-txt",
      "word-to-pdf",
      "powerpoint-to-pdf",
      "excel-to-pdf",
      "image-to-pdf",
      "jpg-to-pdf",
      "png-to-pdf",
      "office-to-pdf",
      "edit-pdf",
      "watermark-pdf",
      "page-numbers-pdf",
      "protect-pdf",
      "unlock-pdf",
      "sign-pdf",
      "redact-pdf",
      "compare-pdf",
      "pdf-forms",
      "web-to-pdf",
      "scan-to-pdf",
      "pdf-extract",
      "pdf-to-markdown",
      "ocr-pdf",
      "ai-summarizer",
      "translate-pdf",
    ]);
  });

  test("registers only executable tools with live processors", () => {
    expect(REGISTERED_TOOLS.map((tool) => tool.id).sort()).toEqual(
      [
        "compare-pdf",
        "compress-pdf",
        "crop-pdf",
        "edit-pdf",
        "excel-to-pdf",
        "jpg-to-pdf",
        "merge-pdf",
        "ocr-pdf",
        "office-to-pdf",
        "organize-pdf",
        "page-numbers-pdf",
        "pdf-extract",
        "pdf-forms",
        "pdf-to-excel",
        "pdf-to-excel-ocr",
        "pdf-to-jpg",
        "pdf-to-markdown",
        "pdf-to-pdfa",
        "pdf-to-png",
        "pdf-to-powerpoint",
        "pdf-to-txt",
        "pdf-to-word",
        "pdf-to-word-ocr",
        "png-to-pdf",
        "powerpoint-to-pdf",
        "protect-pdf",
        "redact-pdf",
        "remove-pages",
        "repair-pdf",
        "reorder-pages",
        "rotate-pdf",
        "scan-to-pdf",
        "sign-pdf",
        "split-pdf",
        "unlock-pdf",
        "watermark-pdf",
        "word-to-pdf",
      ].sort(),
    );

    for (const tool of REGISTERED_TOOLS) {
      expect(isExecutableTool(tool)).toBe(true);
      expect(isLiveProcessorId(tool.processorId)).toBe(true);
    }
  });

  test("planned tools do not pretend to be executable", () => {
    const planned = listCatalogTools().filter(
      (tool) => tool.availability === "planned",
    );

    expect(planned.length).toBeGreaterThan(0);

    for (const tool of planned) {
      expect(isRegisteredToolId(tool.id)).toBe(false);
      expect(findRegisteredTool(tool.id)).toBeUndefined();
      expect(isAnonymousToolAllowed(tool.id)).toBe(false);
      expect(isExecutableTool(tool)).toBe(false);
    }
  });

  test("keeps web and api credit costs independent and configured", () => {
    for (const tool of TOOL_CATALOG) {
      const pricing = TOOL_CREDIT_PRICING[tool.id];
      expect(pricing).toBeDefined();
      expect(tool.webCreditCost).toBe(pricing.webCreditCost);
      expect(tool.apiCreditCost).toBe(pricing.apiCreditCost);
      expect(tool.webCreditCost).toBeGreaterThan(0);
      expect(tool.apiCreditCost).toBeGreaterThan(0);
    }

    expect(TOOL_CREDIT_PRICING["pdf-to-word-ocr"].webCreditCost).not.toBe(
      TOOL_CREDIT_PRICING["pdf-to-word-ocr"].apiCreditCost,
    );
  });

  test("groups the full catalog for directory UIs", () => {
    const groups = groupCatalogToolsByCategory();
    const groupedIds = groups.flatMap((group) =>
      group.tools.map((tool) => tool.id),
    );

    expect(groupedIds.sort()).toEqual(
      [...TOOL_CATALOG.map((tool) => tool.id)].sort(),
    );
    expect(groups.map((group) => group.category)).toEqual([
      "organize",
      "optimize",
      "convert",
      "edit",
      "security",
      "document",
      "intelligence",
    ]);
  });

  test("allows anonymous use only for registered anonymous tools", () => {
    expect(isRegisteredToolId("merge-pdf")).toBe(true);
    expect(isAnonymousToolAllowed("merge-pdf")).toBe(true);
    expect(isAnonymousToolAllowed("protect-pdf")).toBe(false);
    expect(isAnonymousToolAllowed("unlock-pdf")).toBe(false);
    expect(isAnonymousToolAllowed("ocr-pdf")).toBe(false);
    expect(isAnonymousToolAllowed("unknown-tool")).toBe(false);
    expect(findCatalogTool("web-to-pdf")?.availability).toBe("planned");
    expect(findCatalogTool("ocr-pdf")?.availability).toBe("available");
  });

  test("maps public pages from catalog routes", () => {
    expect(toolPublicPath("merge-pdf")).toBe("/merge-pdf");
    expect(toolPublicPath("pdf-to-word")).toBe("/pdf-to-word");
    expect(
      listRegisteredTools().every((tool) => tool.route === `/${tool.id}`),
    ).toBe(true);
  });
});
