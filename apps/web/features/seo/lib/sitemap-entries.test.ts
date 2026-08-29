import { describe, expect, test } from "bun:test";
import { listRegisteredTools } from "@sohappypdf/tools/catalog";
import { AUTH_PATHS } from "@/features/auth/paths";
import { listBlogSlugs } from "@/features/blog/lib/load-blog-posts";
import { PUBLIC_MARKETING_ROUTES } from "@/features/marketing/lib/marketing-paths";
import {
  MARKETING_TOOL_CATEGORY_ORDER,
  toolCategoryPath,
} from "@/features/marketing/lib/marketing-tools";
import {
  buildSitemap,
  listPublicSitemapEntries,
  toSitemapUrl,
} from "@/features/seo/lib/sitemap-entries";

describe("public sitemap entries", () => {
  test("covers marketing, tools, categories, and blog posts once", () => {
    const paths = listPublicSitemapEntries().map((entry) => entry.path);

    expect(paths).toEqual(expect.arrayContaining([...PUBLIC_MARKETING_ROUTES]));
    expect(paths).toContain(AUTH_PATHS.forgotPassword);
    expect(paths).toEqual(
      expect.arrayContaining(
        MARKETING_TOOL_CATEGORY_ORDER.map((category) =>
          toolCategoryPath(category),
        ),
      ),
    );
    expect(paths).toEqual(
      expect.arrayContaining(listRegisteredTools().map((tool) => tool.route)),
    );
    expect(paths).toEqual(
      expect.arrayContaining(
        listBlogSlugs("en").map((slug) => `/blog/${slug}`),
      ),
    );
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).not.toContain("/account");
    expect(paths).not.toContain("/ui");
    expect(paths).not.toContain("/register");
    expect(paths).not.toContain("/reset-password");
    expect(paths).not.toContain("/#product");
  });

  test("builds absolute URLs without a trailing slash on the homepage", () => {
    const sitemap = buildSitemap("https://sohappypdf.example/");

    expect(toSitemapUrl("https://sohappypdf.example/", "/")).toBe(
      "https://sohappypdf.example",
    );
    expect(
      sitemap.some((entry) => entry.url === "https://sohappypdf.example"),
    ).toBe(true);
    expect(
      sitemap.some(
        (entry) => entry.url === "https://sohappypdf.example/merge-pdf",
      ),
    ).toBe(true);
  });
});
