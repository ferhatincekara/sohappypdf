import { describe, expect, test } from "bun:test";
import { isBlogSlug } from "@/features/blog/lib/blog-frontmatter";
import {
  getBlogPost,
  listBlogPosts,
  listBlogSlugs,
} from "@/features/blog/lib/load-blog-posts";

const EXPECTED_SLUGS = [
  "sign-pdf-in-the-browser",
  "compress-pdf-without-losing-quality",
  "check-before-pdf-to-word",
] as const;

describe("blog posts", () => {
  test("loads the same slugs in both locales, newest first", () => {
    expect(listBlogSlugs("en")).toEqual([...EXPECTED_SLUGS]);
    expect(listBlogSlugs("tr")).toEqual([...EXPECTED_SLUGS]);
  });

  test("keeps Turkish titles aligned with the marketing reference", () => {
    const posts = listBlogPosts("tr");

    expect(posts.map((post) => post.title)).toEqual([
      "Tarayıcıda imza: yazıcıyı ortadan kaldırmanın pratik yolu",
      "PDF’i 1 MB altına indirip kaliteyi nasıl korursun",
      "Sözleşmeyi Word’e çevirmeden önce kontrol etmen gereken 5 şey",
    ]);
  });

  test("returns a full markdown body for each post", () => {
    for (const slug of EXPECTED_SLUGS) {
      const english = getBlogPost("en", slug);
      const turkish = getBlogPost("tr", slug);

      expect(english).toBeDefined();
      expect(turkish).toBeDefined();
      expect(english?.body.includes("##")).toBe(true);
      expect(turkish?.body.includes("##")).toBe(true);
      expect(english?.slug).toBe(slug);
      expect(isBlogSlug(slug)).toBe(true);
    }
  });

  test("uses local cover images under public/images/blog", () => {
    for (const post of [...listBlogPosts("en"), ...listBlogPosts("tr")]) {
      expect(post.cover).toMatch(/^\/images\/blog\/[a-z0-9-]+\.jpg$/);
    }
  });

  test("attributes every post to the founder", () => {
    for (const post of [...listBlogPosts("en"), ...listBlogPosts("tr")]) {
      expect(post.author).toBe("Ferhat İncekara");
    }

    expect(listBlogPosts("en").every((post) => post.role === "Founder")).toBe(
      true,
    );
    expect(listBlogPosts("tr").every((post) => post.role === "Kurucu")).toBe(
      true,
    );
  });

  test("does not claim instant processing", () => {
    const copy = [...listBlogPosts("en"), ...listBlogPosts("tr")]
      .map((post) => `${post.title} ${post.description} ${post.body}`)
      .join(" ");

    expect(copy.toLowerCase()).not.toContain("instant");
  });

  test("ignores unknown slugs", () => {
    expect(getBlogPost("en", "not-a-post")).toBeUndefined();
    expect(getBlogPost("en", "Not Valid")).toBeUndefined();
  });
});
