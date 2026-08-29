import { ArrowLeftIcon, ArrowUpRightIcon } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { BlogMarkdown } from "@/features/blog/components/blog-markdown";
import type { BlogPost } from "@/features/blog/lib/blog-frontmatter";
import { formatBlogDate } from "@/features/blog/lib/format-blog-date";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { Link } from "@/lib/i18n/navigation";

export async function BlogPostArticle({ post }: { post: BlogPost }) {
  const t = await getTranslations("blog");
  const locale = await getLocale();

  return (
    <article className="pb-16 pt-6 md:pb-24 md:pt-10">
      <MarketingContainer className="max-w-3xl">
        <Link
          href={MARKETING_PATHS.blog}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {t("back")}
        </Link>

        <header className="mt-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-balance md:text-5xl md:leading-tight">
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-bold">{post.author}</p>
                <p className="text-xs text-muted-foreground">{post.role}</p>
              </div>
            </div>
            <time
              dateTime={post.date}
              className="text-sm text-muted-foreground"
            >
              {formatBlogDate(post.date, locale)}
            </time>
          </div>
        </header>
      </MarketingContainer>

      <MarketingContainer className="mt-10 max-w-3xl">
        <div className="relative h-56 overflow-hidden rounded-7 md:h-80">
          <Image
            src={post.cover}
            alt={post.coverAlt}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 768px, 100vw"
          />
        </div>
      </MarketingContainer>

      <MarketingContainer className="mt-10 max-w-3xl">
        <BlogMarkdown content={post.body} />
        <div className="mt-12 border-t border-border pt-8">
          <Button
            variant="secondary"
            size="lg"
            nativeButton={false}
            render={<Link href={post.toolHref as Route} />}
          >
            {t("openTool")}
            <ArrowUpRightIcon />
          </Button>
        </div>
      </MarketingContainer>
    </article>
  );
}
