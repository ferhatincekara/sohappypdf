import { describe, expect, test } from "bun:test";
import { blogUrlTransform, isInternalMarkdownHref } from "./blog-url-transform";

describe("blogUrlTransform", () => {
  test("keeps in-app tool links", () => {
    expect(isInternalMarkdownHref("/pdf-to-word")).toBe(true);
    expect(blogUrlTransform("/pdf-to-word")).toBe("/pdf-to-word");
    expect(blogUrlTransform("/pdf-to-word-ocr")).toBe("/pdf-to-word-ocr");
  });

  test("rejects javascript URLs", () => {
    expect(blogUrlTransform("javascript:alert(1)")).toBe("");
  });
});
