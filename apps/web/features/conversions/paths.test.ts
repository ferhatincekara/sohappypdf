import { describe, expect, test } from "bun:test";
import { conversionPath } from "./paths";

describe("conversion path", () => {
  test("uses the API conversion id for deep links", () => {
    expect(conversionPath("22222222-2222-4222-8222-222222222222")).toBe(
      "/app/conversions/22222222-2222-4222-8222-222222222222",
    );
  });
});
