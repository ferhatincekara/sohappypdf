import { describe, expect, test } from "bun:test";
import { conversionQueryKeys } from "@/features/conversions/api/conversion-query-keys";

describe("conversion query keys", () => {
  test("keeps history list keys under a shared prefix for invalidation", () => {
    const all = conversionQueryKeys.list({});
    const filtered = conversionQueryKeys.list({ status: "completed" });

    expect(all.slice(0, 2)).toEqual(conversionQueryKeys.lists());
    expect(filtered.slice(0, 2)).toEqual(conversionQueryKeys.lists());
    expect(conversionQueryKeys.detail("abc").slice(0, 2)).toEqual([
      "conversions",
      "detail",
    ]);
  });
});
