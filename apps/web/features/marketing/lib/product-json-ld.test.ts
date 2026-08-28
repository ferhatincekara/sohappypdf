import { describe, expect, test } from "bun:test";
import {
  buildProductJsonLd,
  productJsonLdContainsReviews,
} from "./product-json-ld";

describe("product structured data", () => {
  test("describes the product without fake reviews or organization details", () => {
    const jsonLd = buildProductJsonLd({
      name: "SoHappyPDF",
      description: "Convert PDFs and images.",
      url: "http://localhost:3000",
      freePlanName: "Free",
    });

    expect(jsonLd["@type"]).toBe("SoftwareApplication");
    expect(jsonLd.name).toBe("SoHappyPDF");
    expect(jsonLd).not.toHaveProperty("aggregateRating");
    expect(jsonLd).not.toHaveProperty("review");
    expect(jsonLd).not.toHaveProperty("address");
    expect(productJsonLdContainsReviews(jsonLd)).toBe(false);
  });
});
