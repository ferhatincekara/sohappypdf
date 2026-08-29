import { describe, expect, test } from "bun:test";
import {
  buildPublicToolMetadata,
  openGraphLocale,
  publicToolCanonicalUrl,
} from "@/features/public-tools/lib/public-tool-metadata";

describe("public tool metadata", () => {
  test("builds unique title, description, OpenGraph, and canonical URL", () => {
    const merge = buildPublicToolMetadata({
      name: "Merge PDF",
      metaTitle: "Merge PDF files online",
      description: "Combine multiple PDFs into one file.",
      path: "/merge-pdf",
      appUrl: "https://sohappypdf.example",
      locale: "en",
    });
    const split = buildPublicToolMetadata({
      name: "Split PDF",
      description: "Extract pages or split a PDF into separate files.",
      path: "/split-pdf",
      appUrl: "https://sohappypdf.example",
      locale: "en",
    });

    expect(merge.title).toBe("Merge PDF files online");
    expect(merge.description).toBe("Combine multiple PDFs into one file.");
    expect(merge.openGraph).toMatchObject({
      title: "Merge PDF files online - SoHappyPDF",
      description: "Combine multiple PDFs into one file.",
      url: "https://sohappypdf.example/merge-pdf",
      siteName: "SoHappyPDF",
      type: "website",
      locale: "en_US",
      images: [{ url: "/opengraph-image.png" }],
    });
    expect(merge.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Merge PDF files online - SoHappyPDF",
    });
    expect(merge.alternates).toMatchObject({
      canonical: "https://sohappypdf.example/merge-pdf",
    });
    expect(merge.title).not.toBe(split.title);
    expect(merge.description).not.toBe(split.description);
    expect(
      merge.openGraph && "url" in merge.openGraph ? merge.openGraph.url : null,
    ).not.toBe(
      split.openGraph && "url" in split.openGraph ? split.openGraph.url : null,
    );
  });

  test("maps locales without stuffing extra keywords", () => {
    expect(openGraphLocale("tr")).toBe("tr_TR");
    expect(openGraphLocale("en")).toBe("en_US");
    expect(
      publicToolCanonicalUrl({
        appUrl: "https://sohappypdf.example/",
        path: "/ocr-pdf",
      }),
    ).toBe("https://sohappypdf.example/ocr-pdf");
  });
});
