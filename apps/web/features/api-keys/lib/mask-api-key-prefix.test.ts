import { describe, expect, test } from "bun:test";
import { maskApiKeyPrefix } from "@/features/api-keys/lib/mask-api-key-prefix";

describe("maskApiKeyPrefix", () => {
  test("shows the backend prefix and does not invent a secret", () => {
    expect(maskApiKeyPrefix("shpdf_abcd1234")).toBe(
      "shpdf_abcd1234••••••••••••",
    );
    expect(maskApiKeyPrefix("shpdf_abcd1234")).not.toContain("deadbeef");
  });
});
