import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import {
  type BlogPost,
  blogPostFrontmatterSchema,
  isBlogSlug,
} from "@/features/blog/lib/blog-frontmatter";
import type { AppLocale } from "@/lib/i18n/routing";

const BLOG_POST_FILES = {
  en: {
    "sign-pdf-in-the-browser": new URL(
      "../posts/en/sign-pdf-in-the-browser.md",
      import.meta.url,
    ),
    "compress-pdf-without-losing-quality": new URL(
      "../posts/en/compress-pdf-without-losing-quality.md",
      import.meta.url,
    ),
    "check-before-pdf-to-word": new URL(
      "../posts/en/check-before-pdf-to-word.md",
      import.meta.url,
    ),
  },
  tr: {
    "sign-pdf-in-the-browser": new URL(
      "../posts/tr/sign-pdf-in-the-browser.md",
      import.meta.url,
    ),
    "compress-pdf-without-losing-quality": new URL(
      "../posts/tr/compress-pdf-without-losing-quality.md",
      import.meta.url,
    ),
    "check-before-pdf-to-word": new URL(
      "../posts/tr/check-before-pdf-to-word.md",
      import.meta.url,
    ),
  },
} as const;

function asAppLocale(locale: string): AppLocale {
  if (locale === "en" || locale === "tr") {
    return locale;
  }

  throw new Error(`Unsupported blog locale: ${locale}`);
}

function parsePostFile(fileUrl: URL, expectedSlug: string): BlogPost {
  const raw = readFileSync(fileURLToPath(fileUrl), "utf8");
  const parsed = matter(raw);
  const frontmatter = blogPostFrontmatterSchema.parse(parsed.data);

  if (frontmatter.slug !== expectedSlug) {
    throw new Error(
      `Blog slug mismatch in ${fileUrl.pathname}: ${frontmatter.slug} !== ${expectedSlug}`,
    );
  }

  return {
    ...frontmatter,
    body: parsed.content.trim(),
  };
}

export function listBlogPosts(locale: string): readonly BlogPost[] {
  const files = BLOG_POST_FILES[asAppLocale(locale)];
  const posts = Object.entries(files).map(([slug, fileUrl]) =>
    parsePostFile(fileUrl, slug),
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

  const files = BLOG_POST_FILES[asAppLocale(locale)];

  if (!Object.hasOwn(files, slug)) {
    return undefined;
  }

  const fileUrl = files[slug as keyof typeof files];

  try {
    return parsePostFile(fileUrl, slug);
  } catch {
    return undefined;
  }
}

export function listBlogSlugs(locale: string): readonly string[] {
  return listBlogPosts(locale).map((post) => post.slug);
}
