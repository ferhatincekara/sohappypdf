import { describe, expect, test } from "bun:test";
import { blogPostPath } from "@/features/blog/lib/blog-paths";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

describe("blogPostPath", () => {
  test("nests posts under the marketing blog route", () => {
    expect(blogPostPath("check-before-pdf-to-word")).toBe(
      `${MARKETING_PATHS.blog}/check-before-pdf-to-word`,
    );
  });
});
