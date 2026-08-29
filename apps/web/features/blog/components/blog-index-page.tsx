import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { BlogPostCardModel } from "@/features/blog/lib/blog-card";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import { Link } from "@/lib/i18n/navigation";

export async function BlogIndexPage({
  posts,
}: {
  posts: readonly BlogPostCardModel[];
}) {
  const t = await getTranslations("blog");

  return (
    <section className="pb-16 pt-8 md:pb-24 md:pt-12">
      <MarketingContainer>
        <MarketingPageHeader
          title={t("pageTitle")}
          description={t("description")}
        />

        <ul className="mt-12 flex flex-col gap-8 md:mt-16 md:gap-10">
          {posts.map((post) => (
            <li key={post.href}>
              <Link
                href={post.href}
                className="group grid gap-5 md:grid-cols-[minmax(0,--spacing(85))_1fr] md:items-center md:gap-10"
              >
                <div className="relative h-52 overflow-hidden rounded-7 md:h-56">
                  <Image
                    src={post.cover}
                    alt={post.coverAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 768px) 340px, 100vw"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {post.displayDate}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                    {post.title}
                  </h2>
                  <p className="mt-3 max-w-xl text-lg/7 text-muted-foreground">
                    {post.description}
                  </p>
                  <div className="mt-5 flex items-center gap-2">
                    <div className="size-8 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-bold">{post.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.role}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingContainer>
    </section>
  );
}
