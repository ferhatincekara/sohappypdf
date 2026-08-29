import { describe, expect, test } from "bun:test";
import { getPublicApiV1BaseUrl } from "@/config/public-env";
import { getMarketingApiExample } from "@/features/marketing/lib/marketing-api-example";

describe("marketing API example", () => {
  test("uses the configured public API contract and a placeholder key", () => {
    const example = getMarketingApiExample();

    expect(example).toContain(getPublicApiV1BaseUrl());
    expect(example).toContain("/conversions/");
    expect(example).toContain("Authorization: Bearer YOUR_API_KEY");
    expect(example).not.toContain("/v1/files");
    expect(example).not.toContain("shpdf_");
  });
});
