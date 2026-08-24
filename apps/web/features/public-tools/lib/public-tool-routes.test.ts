import { describe, expect, test } from "bun:test";
import { listRegisteredTools } from "@repo/tools/catalog";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { toolPageConflictsWithReservedPath } from "@/features/marketing/lib/marketing-tool-shortcuts";
import { listPublicToolRouteParams } from "./public-tool-routes";

const RESERVED_MARKETING_PATHS = [
  MARKETING_PATHS.home,
  MARKETING_PATHS.tools,
  MARKETING_PATHS.pricing,
  MARKETING_PATHS.developers,
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
