import { describe, expect, test } from "bun:test";
import { REGISTERED_TOOLS } from "./registered-tools.js";
import { toolPublicPath } from "./tool-path.js";
import { isAnonymousToolAllowed, isRegisteredToolId } from "./tool-registry.js";

describe("tool registry", () => {
  test("registers only implemented tools", () => {
    expect(REGISTERED_TOOLS.map((tool) => tool.id)).toEqual([
      "pdf-to-word",
      "pdf-to-jpg",
      "pdf-to-png",
      "pdf-to-txt",
      "jpg-to-pdf",
      "png-to-pdf",
      "merge-pdf",
      "split-pdf",
      "compress-pdf",
    ]);
  });

  test("allows anonymous use of registered tools", () => {
    expect(isRegisteredToolId("merge-pdf")).toBe(true);
    expect(isAnonymousToolAllowed("merge-pdf")).toBe(true);
    expect(isAnonymousToolAllowed("ocr-pdf")).toBe(false);
    expect(isAnonymousToolAllowed("unknown-tool")).toBe(false);
  });

  test("maps public pages from tool identity", () => {
    expect(toolPublicPath("merge-pdf")).toBe("/merge-pdf");
    expect(toolPublicPath("pdf-to-word")).toBe("/pdf-to-word");
  });
});
