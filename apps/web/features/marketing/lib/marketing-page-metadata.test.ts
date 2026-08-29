import { describe, expect, test } from "bun:test";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";

describe("marketing page metadata", () => {
  test("puts the search phrase first and brands the social title", () => {
    const home = buildMarketingPageMetadata({
      title: "Online PDF tools to merge, convert and compress",
      description: "Merge and convert PDFs online.",
      path: "/",
      locale: "en",
    });

    expect(home.title).toBe("Online PDF tools to merge, convert and compress");
    expect(home.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Online PDF tools to merge, convert and compress - SoHappyPDF",
    });
    expect(home.openGraph).toMatchObject({
      title: "Online PDF tools to merge, convert and compress - SoHappyPDF",
      siteName: "SoHappyPDF",
      type: "website",
      images: [{ url: "/opengraph-image.png" }],
    });
  });

  test("leaves inner titles short so the root template can add the brand", () => {
    const pricing = buildMarketingPageMetadata({
      title: "Pricing",
      description: "Compare Free and Pro.",
      path: "/pricing",
      locale: "tr",
    });

    expect(pricing.title).toBe("Pricing");
    expect(pricing.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Pricing - SoHappyPDF",
    });
    expect(pricing.openGraph).toMatchObject({
      title: "Pricing - SoHappyPDF",
      locale: "tr_TR",
    });
  });
});
