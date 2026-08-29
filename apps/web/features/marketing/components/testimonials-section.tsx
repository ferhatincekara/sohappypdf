"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import {
  fadeUp,
  stagger,
  viewportOnce,
} from "@/features/marketing/lib/motion-tokens";

const QUOTE_IDS = ["elif", "mert", "selin", "can"] as const;

export function TestimonialsSection() {
  const t = useTranslations("marketing.testimonials");
  const loop = [...QUOTE_IDS, ...QUOTE_IDS];
  const [paused, setPaused] = useState(false);

  return (
    <section className="overflow-hidden py-16 md:py-24">
      <MarketingContainer className="text-center">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-bold tracking-tight md:text-5xl"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-xl text-lg/7 text-muted-foreground"
          >
            {t("description")}
          </motion.p>
        </motion.div>
      </MarketingContainer>

      <div
        className="relative mt-12"
        onPointerEnter={() => {
          setPaused(true);
        }}
        onPointerLeave={() => {
          setPaused(false);
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-background to-transparent md:w-24"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-background to-transparent md:w-24"
        />
        <div
          className="animate-marquee flex w-max items-stretch gap-5 px-5 motion-reduce:animate-none"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {loop.map((id, index) => (
            <article
              key={`${id}-${String(index)}`}
              className="flex w-[min(24rem,calc(100vw-2.5rem))] shrink-0 flex-col rounded-7 bg-accent p-8 transition-colors duration-300 hover:bg-secondary md:w-96 md:p-10 lg:w-104"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-primary text-sm font-extrabold text-foreground">
                    {t(`quotes.${id}.initials`)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">
                    {t(`quotes.${id}.name`)}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {t(`quotes.${id}.role`)}
                  </p>
                </div>
              </div>

              <p className="mt-6 min-h-0 flex-1 text-lg font-medium leading-snug text-pretty">
                “{t(`quotes.${id}.text`)}”
              </p>

              <div className="mt-6 flex h-12 shrink-0 items-center justify-between gap-3 rounded-full bg-white px-5">
                <p className="truncate font-semibold">
                  {t(`quotes.${id}.tag`)}
                </p>
                <span aria-hidden="true">💖</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
