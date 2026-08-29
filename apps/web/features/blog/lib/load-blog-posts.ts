import matter from "gray-matter";
import {
  type BlogPost,
  blogPostFrontmatterSchema,
  isBlogSlug,
} from "@/features/blog/lib/blog-frontmatter";
import { BLOG_POST_CONTENTS } from "@/features/blog/lib/blog-post-contents";
import type { AppLocale } from "@/lib/i18n/routing";

function asAppLocale(locale: string): AppLocale {
  if (locale === "en" || locale === "tr") {
    return locale;
  }

  throw new Error(`Unsupported blog locale: ${locale}`);
}

function parsePostRaw(raw: string, expectedSlug: string): BlogPost {
  const parsed = matter(raw);
  const frontmatter = blogPostFrontmatterSchema.parse(parsed.data);

  if (frontmatter.slug !== expectedSlug) {
    throw new Error(
      `Blog slug mismatch for ${expectedSlug}: ${frontmatter.slug} !== ${expectedSlug}`,
    );
  }

  return {
    ...frontmatter,
    body: parsed.content.trim(),
  };
}

export function listBlogPosts(locale: string): readonly BlogPost[] {
  const contents = BLOG_POST_CONTENTS[asAppLocale(locale)];
  const posts = Object.entries(contents).map(([slug, raw]) =>
    parsePostRaw(raw, slug),
  );

  return [...posts].sort((left, right) => right.date.localeCompare(left.date));
}

export function getBlogPost(
  locale: string,
  slug: string,
): BlogPost | undefined {
  if (!isBlogSlug(slug)) {
    return undefined;
  }

  const contents = BLOG_POST_CONTENTS[asAppLocale(locale)];

  if (!Object.hasOwn(contents, slug)) {
    return undefined;
  }

  const raw = contents[slug as keyof typeof contents];

  try {
    return parsePostRaw(raw, slug);
  } catch {
    return undefined;
  }
}

export function listBlogSlugs(locale: string): readonly string[] {
  return listBlogPosts(locale).map((post) => post.slug);
}
