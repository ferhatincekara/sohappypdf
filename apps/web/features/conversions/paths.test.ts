import { describe, expect, test } from "bun:test";
import { conversionPath } from "@/features/conversions/paths";

describe("conversion paths", () => {
  test("builds activity detail paths under /account", () => {
    expect(conversionPath("22222222-2222-4222-8222-222222222222")).toBe(
      "/account/activity/22222222-2222-4222-8222-222222222222",
    );
  });
});
