import { z } from "zod";

export const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const BLOG_COVER_PATH_PATTERN =
  /^\/images\/blog\/[a-z0-9][a-z0-9./-]*\.(?:jpg|jpeg|webp|png)$/;

export const blogPostFrontmatterSchema = z.object({
  slug: z.string().regex(BLOG_SLUG_PATTERN),
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.preprocess((value) => {
    if (value instanceof Date) {
      const year = value.getUTCFullYear();
      const month = String(value.getUTCMonth() + 1).padStart(2, "0");
      const day = String(value.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    return value;
  }, z.string().date()),
  author: z.string().min(1),
  role: z.string().min(1),
  cover: z.string().regex(BLOG_COVER_PATH_PATTERN),
  coverAlt: z.string().min(1),
  toolHref: z.string().regex(/^\/[a-z0-9-]+$/),
});

export type BlogPostFrontmatter = z.infer<typeof blogPostFrontmatterSchema>;

export type BlogPost = BlogPostFrontmatter & {
  body: string;
};

export function isBlogSlug(value: string): boolean {
  return BLOG_SLUG_PATTERN.test(value);
}
