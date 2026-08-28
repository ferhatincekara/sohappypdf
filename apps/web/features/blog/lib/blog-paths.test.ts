import { describe, expect, test } from "bun:test";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { blogPostPath } from "./blog-paths";

describe("blogPostPath", () => {
  test("nests posts under the marketing blog route", () => {
    expect(blogPostPath("check-before-pdf-to-word")).toBe(
      `${MARKETING_PATHS.blog}/check-before-pdf-to-word`,
    );
  });
});
