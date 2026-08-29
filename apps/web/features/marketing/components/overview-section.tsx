"use client";

import { motion, useInView } from "motion/react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { fadeUp, viewportOnce } from "@/features/marketing/lib/motion-tokens";
import { Link } from "@/lib/i18n/navigation";

const ACTIVITY_IDS = ["convert", "compress", "merge"] as const;

export function OverviewSection({
  startHref,
  startLabel,
}: {
  startHref: string;
  startLabel: string;
}) {
  const t = useTranslations("marketing.overview");
  const chartRef = useRef<SVGSVGElement>(null);
  const inView = useInView(chartRef, { once: true, amount: 0.6 });

  return (
    <section className="px-4 py-8 md:px-6 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={viewportOnce}
        className="overflow-hidden rounded-10 bg-secondary px-6 py-12 md:px-14 md:py-16"
      >
        <MarketingContainer className="grid items-center gap-12 px-0 lg:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.1 } },
            }}
          >
            <motion.div variants={fadeUp}>
              <Badge variant="white">{t("eyebrow")}</Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="mt-3 max-w-md text-3xl font-bold leading-tight tracking-tight md:text-5xl"
            >
              {t("title")}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-md text-lg/7 text-foreground/85"
            >
              {t("description")}
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button
                variant="white"
                nativeButton={false}
                render={<Link href={startHref} />}
              >
                {startLabel}
              </Button>
              <Button
                variant="white"
                nativeButton={false}
                render={<Link href={MARKETING_PATHS.tools} />}
              >
                {t("toolsCta")}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <Card className="rounded-7 bg-white p-6 shadow-lift md:p-8">
              <CardContent className="p-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {t("weekLabel")}
                    </p>
                    <p className="mt-1 text-3xl font-extrabold">
                      {t("weekValue")}
                    </p>
                  </div>
                  <div className="relative size-20">
                    <svg
                      ref={chartRef}
                      viewBox="0 0 36 36"
                      className="size-20 -rotate-90"
                      aria-hidden="true"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="4"
                      />
                      <motion.circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: inView ? 0.78 : 0 }}
                        transition={{
                          duration: 1.2,
                          ease: [0.22, 1, 0.36, 1],
                          delay: 0.2,
                        }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold">
                      {t("chartValue")}
                    </span>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {ACTIVITY_IDS.map((id, index) => (
                    <motion.li
                      key={id}
                      initial={{ opacity: 0, x: 16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.25 + index * 0.12 }}
                      className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-bold">
                          {t(`activity.${id}.name`)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(`activity.${id}.action`)}
                        </p>
                      </div>
                      <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-xs font-bold">
                        {t(`activity.${id}.time`)}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </MarketingContainer>
      </motion.div>
    </section>
  );
}
