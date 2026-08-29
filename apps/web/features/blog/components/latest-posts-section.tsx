"use client";

import { ArrowUpRightIcon } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { BlogPostCardModel } from "@/features/blog/lib/blog-card";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import {
  fadeUp,
  stagger,
  viewportOnce,
} from "@/features/marketing/lib/motion-tokens";
import { Link } from "@/lib/i18n/navigation";

export function LatestPostsSection({
  posts,
}: {
  posts: readonly BlogPostCardModel[];
}) {
  const t = useTranslations("blog");

  return (
    <section className="px-4 pb-8 md:px-6 md:pb-12">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        className="rounded-10 bg-secondary px-6 py-12 md:px-12 md:py-16"
      >
        <MarketingContainer className="px-0">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                {t("title")}
              </h2>
              <p className="mt-3 max-w-md text-lg/7 text-foreground/80">
                {t("description")}
              </p>
            </div>
            <Link
              href={MARKETING_PATHS.blog}
              className="inline-flex items-center gap-1 text-sm font-bold"
            >
              {t("readAll")}
              <ArrowUpRightIcon className="size-4" />
            </Link>
          </div>

          <motion.div
            className="mt-10 grid gap-5 md:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={stagger}
          >
            {posts.map((post) => (
              <motion.article
                key={post.href}
                variants={fadeUp}
                whileHover={{ y: -8 }}
                className="overflow-hidden rounded-7 bg-white"
              >
                <Link href={post.href} className="block">
                  <div className="relative h-44 overflow-hidden">
                    <motion.div
                      className="absolute inset-0"
                      whileHover={{ scale: 1.06 }}
                      transition={{ duration: 0.45 }}
                    >
                      <Image
                        src={post.cover}
                        alt={post.coverAlt}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 33vw, 100vw"
                      />
                    </motion.div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {post.displayDate}
                    </p>
                    <h3 className="mt-2 text-[17px] font-bold leading-snug">
                      {post.title}
                    </h3>
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
              </motion.article>
            ))}
          </motion.div>
        </MarketingContainer>
      </motion.div>
    </section>
  );
}
