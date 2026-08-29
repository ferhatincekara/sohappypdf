import { describe, expect, test } from "bun:test";
import { listRegisteredTools } from "@sohappypdf/tools/catalog";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { toolPageConflictsWithReservedPath } from "@/features/marketing/lib/marketing-tool-shortcuts";
import { listPublicToolRouteParams } from "@/features/public-tools/lib/public-tool-routes";

const RESERVED_MARKETING_PATHS = [
  MARKETING_PATHS.home,
  MARKETING_PATHS.tools,
  MARKETING_PATHS.pricing,
  MARKETING_PATHS.faq,
  MARKETING_PATHS.blog,
  MARKETING_PATHS.about,
  MARKETING_PATHS.contact,
  MARKETING_PATHS.developers,
  MARKETING_PATHS.security,
  MARKETING_PATHS.privacy,
  MARKETING_PATHS.terms,
  MARKETING_PATHS.cookies,
] as const;

describe("public tool routes", () => {
  test("creates a static route for every executable tool only", () => {
    const registered = listRegisteredTools();
    const params = listPublicToolRouteParams();

    expect(params.map((item) => item.toolId).sort()).toEqual(
      registered.map((tool) => tool.id).sort(),
    );
    expect(params.every((item) => item.toolId !== "image-to-pdf")).toBe(true);
    expect(params.every((item) => item.toolId !== "web-to-pdf")).toBe(true);
    expect(params.every((item) => item.toolId !== "ai-summarizer")).toBe(true);
    expect(params.every((item) => item.toolId !== "translate-pdf")).toBe(true);
    expect(params.every((item) => item.toolId !== "pdf-forms")).toBe(true);
  });

  test("keeps tool URLs from colliding with marketing pages", () => {
    const conflicts = listRegisteredTools().filter((tool) =>
      toolPageConflictsWithReservedPath(tool, RESERVED_MARKETING_PATHS),
    );

    expect(conflicts).toEqual([]);
    expect(
      listRegisteredTools().every((tool) => tool.route === `/${tool.id}`),
    ).toBe(true);
  });
});
