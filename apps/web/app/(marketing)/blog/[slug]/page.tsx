import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import {
  BlogPostArticle,
  blogPostPath,
  getBlogPost,
  listBlogSlugs,
} from "@/features/blog";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return listBlogSlugs("en").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = getBlogPost(locale, slug);

  if (post === undefined) {
    return {};
  }

  return buildMarketingPageMetadata({
    title: post.title,
    description: post.description,
    path: blogPostPath(post.slug),
    locale,
  });
}

export default async function BlogPostRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const post = getBlogPost(locale, slug);

  if (post === undefined) {
    notFound();
  }

  return <BlogPostArticle post={post} />;
}
