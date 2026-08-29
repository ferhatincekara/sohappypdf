import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import {
  type BlogPost,
  blogPostFrontmatterSchema,
  isBlogSlug,
} from "@/features/blog/lib/blog-frontmatter";
import type { AppLocale } from "@/lib/i18n/routing";

const POSTS_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../posts");

function asAppLocale(locale: string): AppLocale {
  if (locale === "en" || locale === "tr") {
    return locale;
  }

  throw new Error(`Unsupported blog locale: ${locale}`);
}

function localeDir(locale: string): string {
  return join(POSTS_ROOT, asAppLocale(locale));
}

function parsePostFile(filePath: string, expectedSlug: string): BlogPost {
  const raw = readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const frontmatter = blogPostFrontmatterSchema.parse(parsed.data);

  if (frontmatter.slug !== expectedSlug) {
    throw new Error(
      `Blog slug mismatch in ${filePath}: ${frontmatter.slug} !== ${expectedSlug}`,
    );
  }

  return {
    ...frontmatter,
    body: parsed.content.trim(),
  };
}

export function listBlogPosts(locale: string): readonly BlogPost[] {
  const files = readdirSync(localeDir(locale)).filter((name) =>
    name.endsWith(".md"),
  );

  const posts = files.map((name) => {
    const slug = name.slice(0, -3);

    if (!isBlogSlug(slug)) {
      throw new Error(`Invalid blog filename: ${name}`);
    }

    return parsePostFile(join(localeDir(locale), name), slug);
  });

  return [...posts].sort((left, right) => right.date.localeCompare(left.date));
}

export function getBlogPost(
  locale: string,
  slug: string,
): BlogPost | undefined {
  if (!isBlogSlug(slug)) {
    return undefined;
  }

  try {
    return parsePostFile(join(localeDir(locale), `${slug}.md`), slug);
  } catch {
    return undefined;
  }
}

export function listBlogSlugs(locale: string): readonly string[] {
  return listBlogPosts(locale).map((post) => post.slug);
}
