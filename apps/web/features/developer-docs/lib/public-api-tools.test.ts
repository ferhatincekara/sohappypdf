import { describe, expect, test } from "bun:test";
import { listRegisteredTools } from "@repo/tools/catalog";
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
});
