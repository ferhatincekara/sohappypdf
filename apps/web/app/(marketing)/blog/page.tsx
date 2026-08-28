import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BlogIndexPage, listBlogPosts, toBlogPostCard } from "@/features/blog";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.metadata");
  const locale = await getLocale();

  return buildMarketingPageMetadata({
    title: t("blogTitle"),
    description: t("blogDescription"),
    path: MARKETING_PATHS.blog,
    locale,
  });
}

export default async function BlogRoute() {
  const locale = await getLocale();
  const posts = listBlogPosts(locale).map((post) =>
    toBlogPostCard(post, locale),
  );

  return <BlogIndexPage posts={posts} />;
}
