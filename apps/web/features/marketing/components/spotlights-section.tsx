"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MarketingScene } from "@/features/marketing/components/marketing-scene";
import { fadeUp, viewportOnce } from "@/features/marketing/lib/motion-tokens";
import { Link } from "@/lib/i18n/navigation";

const SPOTS = [
  {
    id: "convert",
    href: "/pdf-to-word",
    reverse: false,
    kind: "convert",
    overlay: "success",
  },
  {
    id: "compress",
    href: "/compress-pdf",
    reverse: true,
    kind: "compress",
    overlay: "compress",
  },
  {
    id: "protect",
    href: "/protect-pdf",
    reverse: false,
    kind: "protect",
    overlay: "sign",
  },
] as const;

export function SpotlightsSection() {
  const t = useTranslations("marketing.spotlights");

  return (
    <section className="py-16 md:py-24">
      <MarketingContainer className="mb-14 text-center md:mb-20">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="text-balance text-3xl font-bold tracking-tight md:text-5xl"
        >
          {t("title")}
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto mt-5 max-w-3xl text-lg/7 text-muted-foreground"
        >
          {t("description")}
        </motion.p>
      </MarketingContainer>

      <div className="space-y-20 md:space-y-28">
        {SPOTS.map((spot) => (
          <MarketingContainer
            key={spot.id}
            className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
              spot.reverse ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <motion.div
              initial={{ opacity: 0, x: spot.reverse ? 32 : -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7 }}
            >
              <Badge variant="muted">{t(`${spot.id}.eyebrow`)}</Badge>
              <h3 className="mt-3 max-w-md text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                {t(`${spot.id}.title`)}
              </h3>
              <p className="mt-4 max-w-md text-lg/7 text-muted-foreground">
                {t(`${spot.id}.text`)}
              </p>
              <Button
                className="mt-8"
                nativeButton={false}
                render={<Link href={spot.href} />}
              >
                {t(`${spot.id}.cta`)}
              </Button>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.75, delay: 0.1 }}
            >
              <MarketingScene size="spotlight" kind={spot.kind}>
                {spot.overlay === "compress" ? (
                  <motion.div
                    className="absolute right-5 top-5 hidden sm:right-8 sm:top-8 md:block"
                    initial={{ opacity: 0, y: 12, rotate: 4 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.55 }}
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 4.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <CompressChip />
                    </motion.div>
                  </motion.div>
                ) : null}
                <motion.div
                  className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-auto"
                  initial={{ opacity: 0, y: 16, rotate: -3 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: 0.25, duration: 0.6 }}
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 4.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {spot.overlay === "success" ? <SuccessOverlay /> : null}
                    {spot.overlay === "compress" ? <CompressOverlay /> : null}
                    {spot.overlay === "sign" ? <SignOverlay /> : null}
                  </motion.div>
                </motion.div>
              </MarketingScene>
            </motion.div>
          </MarketingContainer>
        ))}
      </div>
    </section>
  );
}

function SuccessOverlay() {
  const t = useTranslations("marketing.spotlights.convert.overlay");

  return (
    <Card className="w-70 rounded-lg p-5 shadow-lift">
      <CardContent className="p-0">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 380, damping: 16 }}
          className="flex size-10 items-center justify-center rounded-full bg-primary text-lg"
        >
          ✓
        </motion.div>
        <p className="mt-3 text-sm font-extrabold">{t("title")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("meta")}</p>
        <div className="mt-3 h-9 rounded-full bg-primary text-center text-sm font-bold leading-9">
          {t("cta")}
        </div>
      </CardContent>
    </Card>
  );
}

function CompressChip() {
  const t = useTranslations("marketing.spotlights.compress.overlay");

  return (
    <Card className="w-40 rounded-md p-3 shadow-lift">
      <CardContent className="p-0">
        <p className="text-xs font-semibold text-muted-foreground">
          {t("beforeSize")}
        </p>
        <p className="mt-0.5 text-lg font-extrabold tracking-tight">
          {t("afterSize")}
        </p>
      </CardContent>
    </Card>
  );
}

function CompressOverlay() {
  const t = useTranslations("marketing.spotlights.compress.overlay");

  return (
    <Card className="w-70 rounded-lg p-5 shadow-lift">
      <CardContent className="p-0">
        <p className="text-sm font-bold">{t("title")}</p>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("before")}</span>
            <span>{t("beforeSize")}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-accent">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "100%" }}
              whileInView={{ width: "28%" }}
              viewport={{ once: true }}
              transition={{
                duration: 1.1,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.2,
              }}
            />
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>{t("after")}</span>
            <span>{t("afterSize")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SignOverlay() {
  const t = useTranslations("marketing.spotlights.protect.overlay");

  return (
    <Card className="w-67.5 rounded-lg p-5 shadow-lift">
      <CardContent className="p-0">
        <p className="text-xs font-semibold text-muted-foreground">
          {t("title")}
        </p>
        <motion.p
          className="mt-2 origin-left font-serif text-2xl italic"
          initial={{ opacity: 0, scaleX: 0.2 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {t("name")}
        </motion.p>
        <p className="mt-1 text-xs text-muted-foreground">{t("meta")}</p>
      </CardContent>
    </Card>
  );
}
