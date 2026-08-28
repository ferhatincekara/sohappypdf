"use client";

import { CheckIcon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { fadeUp, stagger, viewportOnce } from "../lib/motion-tokens";
import { MarketingContainer } from "./marketing-container";

const CARDS = ["speed", "privacy", "anywhere"] as const;

export function WhyChooseSection({ toolCount }: { toolCount: number }) {
  const t = useTranslations("marketing.whyChoose");

  return (
    <section className="px-4 py-8 md:px-6 md:py-12">
      <div className="overflow-hidden rounded-10 bg-secondary py-12 md:py-16">
        <MarketingContainer>
          <motion.div
            className="mx-auto max-w-2xl text-center"
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
              className="mt-4 text-lg/7 text-foreground"
            >
              {t("description")}
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-12 grid items-stretch gap-5 md:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={stagger}
          >
            {CARDS.map((id) => (
              <motion.article
                key={id}
                variants={fadeUp}
                className="flex h-full flex-col overflow-hidden rounded-7 bg-white"
              >
                <div className="relative flex h-44 shrink-0 items-center justify-center bg-muted">
                  {id === "speed" ? <SpeedGraphic /> : null}
                  {id === "privacy" ? <PrivacyGraphic /> : null}
                  {id === "anywhere" ? <AnywhereGraphic /> : null}
                </div>

                <div className="flex flex-col items-center px-6 py-6 text-center">
                  <h3 className="text-xl font-bold tracking-tight">
                    {t(`${id}.title`)}
                  </h3>
                  <p className="mt-2 min-h-12 text-sm leading-relaxed text-muted-foreground">
                    {t(`${id}.text`)}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                    <span className="flex size-5 items-center justify-center rounded-full bg-secondary-strong">
                      <CheckIcon className="size-3 text-background" />
                    </span>
                    <span className="text-sm font-medium">
                      {id === "anywhere"
                        ? t(`${id}.stat`, { count: toolCount })
                        : t(`${id}.stat`)}
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </MarketingContainer>
      </div>
    </section>
  );
}

function FileChip({
  mark,
  title,
  meta,
  className,
}: {
  mark: string;
  title: string;
  meta: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-57.5 items-center gap-3 rounded-full bg-white px-3 py-2 shadow-soft",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold">
        {mark}
      </span>
      <div className="min-w-0 text-left">
        <p className="truncate text-sm font-bold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}

function SpeedGraphic() {
  const t = useTranslations("marketing.whyChoose.visual");

  return (
    <div className="flex w-full flex-col items-center gap-2 px-6">
      <FileChip mark="PDF" title={t("word")} meta={t("wordFile")} />
      <FileChip
        mark="XLS"
        title={t("excel")}
        meta={t("excelFile")}
        className="translate-x-4"
      />
    </div>
  );
}

function PrivacyGraphic() {
  const t = useTranslations("marketing.whyChoose.visual");

  return (
    <div className="relative h-28 w-44">
      <div className="absolute left-0 top-6 h-26 w-36 -rotate-10 rounded-2xl bg-secondary/50" />
      <div className="absolute left-4 top-3 h-26 w-36 -rotate-4 rounded-2xl bg-secondary" />
      <div className="absolute left-8 top-0 flex h-26 w-36 flex-col justify-between rounded-2xl bg-foreground p-3 text-background">
        <span className="text-[11px] font-extrabold">{t("fileMark")}</span>
        <span className="text-xs">{t("fileMeta")}</span>
      </div>
    </div>
  );
}

function AnywhereGraphic() {
  const t = useTranslations("marketing.whyChoose.visual");

  return (
    <div className="flex w-full flex-col items-center gap-2 px-6">
      <FileChip mark="W" title={t("wordOut")} meta={t("wordOutMeta")} />
      <FileChip
        mark="X"
        title={t("excelOut")}
        meta={t("excelOutMeta")}
        className="translate-x-4"
      />
    </div>
  );
}
