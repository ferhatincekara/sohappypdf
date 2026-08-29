import { describe, expect, test } from "bun:test";
import {
  buildPublicToolFaqJsonLd,
  buildPublicToolWebPageJsonLd,
} from "@/features/public-tools/lib/public-tool-json-ld";

describe("public tool structured data", () => {
  test("describes the page and FAQ without reviews", () => {
    const page = buildPublicToolWebPageJsonLd({
      name: "Merge PDF",
      description: "Combine multiple PDFs into one file.",
      url: "https://sohappypdf.example/merge-pdf",
    });
    const faq = buildPublicToolFaqJsonLd({
      items: [
        {
          id: "what",
          question: "What does Merge PDF do?",
          answer: "Combine multiple PDFs into one file.",
        },
      ],
    });

    expect(page["@type"]).toBe("WebPage");
    expect(faq["@type"]).toBe("FAQPage");
    expect(JSON.stringify(page).toLowerCase()).not.toContain("aggregaterating");
    expect(JSON.stringify(faq).toLowerCase()).not.toContain("review");
  });
});
