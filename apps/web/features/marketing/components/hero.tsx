"use client";

import { ShieldCheckIcon, SparklesIcon, ZapIcon } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/lib/i18n/navigation";
import { MARKETING_PATHS } from "../lib/marketing-paths";
import { fadeUp, stagger } from "../lib/motion-tokens";
import { MarketingContainer } from "./marketing-container";
import { StarMark } from "./star-mark";

const HERO_IMAGE = "/images/marketing/hero-team.jpg";

const HIGHLIGHTS = [
  { id: "speed", icon: ZapIcon },
  { id: "quality", icon: SparklesIcon },
  { id: "privacy", icon: ShieldCheckIcon },
] as const;

export function Hero({
  isAuthenticated,
  startHref,
  toolCount,
}: {
  isAuthenticated: boolean;
  startHref: string;
  toolCount: number;
}) {
  const t = useTranslations("marketing.hero");

  return (
    <section className="relative overflow-x-hidden pb-8 pt-10 md:pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <motion.div
          className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 24, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-16 top-40 h-80 w-80 rounded-full bg-secondary/25 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 18, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <MarketingContainer className="relative text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="flex flex-col items-center"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full bg-muted px-3 py-1 text-[13px] font-medium text-foreground/85"
          >
            <motion.span
              animate={{ rotate: [0, 14, -8, 0], scale: [1, 1.18, 1] }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-flex text-primary"
            >
              <StarMark className="size-4" />
            </motion.span>
            {t("eyebrow", { count: toolCount })}
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 max-w-5xl text-pretty wrap-break-word text-[2.35rem] font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-[64px]"
          >
            {t.rich("title", {
              smile: (chunks) => (
                <span className="smile-underline">{chunks}</span>
              ),
            })}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-3xl text-lg/7 text-muted-foreground"
          >
            {t("description")}
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href={startHref} />}
            >
              {isAuthenticated ? t("accountCta") : t("primaryCta")}
            </Button>
            {isAuthenticated ? null : (
              <Button
                variant="ghost"
                size="lg"
                nativeButton={false}
                render={<Link href={MARKETING_PATHS.tools} />}
              >
                {t("secondaryCta")}
              </Button>
            )}
          </motion.div>
        </motion.div>
      </MarketingContainer>

      <MarketingContainer className="relative mt-12 md:mt-16">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-10"
        >
          <Image
            src={HERO_IMAGE}
            alt={t("imageAlt")}
            width={1800}
            height={1200}
            priority
            sizes="(max-width: 1180px) 100vw, 1180px"
            className="h-85 w-full object-cover sm:h-105 md:h-130"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-transparent" />

          <motion.div
            className="absolute inset-x-5 bottom-5 min-w-0 max-w-full sm:inset-x-auto sm:bottom-8 sm:left-8 sm:w-85"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.7,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ConvertCard />
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute right-5 top-5 hidden rounded-2xl bg-white/95 px-4 py-3 shadow-lift sm:right-8 sm:top-8 md:block"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {t("chipLabel")}
            </p>
            <p className="text-lg font-extrabold">{t("chipValue")}</p>
          </motion.div>
        </motion.div>
      </MarketingContainer>

      <MarketingContainer className="mt-14 md:mt-20">
        <motion.div
          className="grid gap-8 md:grid-cols-3 md:gap-10"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={stagger}
        >
          {HIGHLIGHTS.map((item) => (
            <motion.div
              key={item.id}
              variants={fadeUp}
              className="flex gap-4 text-left"
            >
              <motion.div
                whileHover={{ rotate: -8, scale: 1.08 }}
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted"
              >
                <item.icon className="size-5" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold">
                  {t(`highlights.${item.id}.title`)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(`highlights.${item.id}.text`)}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </MarketingContainer>
    </section>
  );
}

function ConvertCard() {
  const t = useTranslations("marketing.hero.convertCard");

  return (
    <Card className="rounded-7 bg-white p-5 shadow-lift">
      <CardContent className="p-0">
        <p className="text-sm font-bold">{t("title")}</p>
        <Link
          href="/pdf-to-word"
          className="mt-3 block rounded-2xl border border-dashed border-border bg-accent px-3 py-3 outline-none"
        >
          <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-soft">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-[9px] font-extrabold tracking-wide text-background">
              PDF
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">
                {t("fileName")}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t("fileMeta")}
              </span>
            </span>
          </div>
          <p className="mt-2.5 text-center text-xs text-muted-foreground">
            {t("orSelect")}
          </p>
        </Link>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-accent px-3 py-2.5 text-sm">
          <span className="font-medium">{t("conversion")}</span>
          <Badge>{t("free")}</Badge>
        </div>
        <Button
          size="sm"
          className="mt-4 w-full"
          nativeButton={false}
          render={<Link href="/pdf-to-word" />}
        >
          {t("cta")}
        </Button>
      </CardContent>
    </Card>
  );
}
