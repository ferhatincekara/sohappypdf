"use client";

import { ArrowRightIcon, LockIcon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function OverviewScene() {
  const t = useTranslations("marketing.overview");

  return (
    <div className="relative isolate h-90 w-full overflow-visible sm:h-105 md:h-115">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-8 top-0 size-64 rounded-full bg-primary/45 blur-3xl" />
        <div className="absolute -left-10 bottom-4 size-52 rounded-full bg-white/55 blur-3xl" />
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center sm:justify-end sm:pr-4 md:pr-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative h-56 w-72 sm:h-64 sm:w-84 md:h-72 md:w-96">
          <div className="absolute left-1 top-12 h-44 w-30 -rotate-18 rounded-[26px] border border-border bg-white/55 sm:h-52 sm:w-36" />
          <div className="absolute left-5 top-8 h-40 w-27 -rotate-10 rounded-3xl border border-border bg-white sm:h-48 sm:w-32">
            <div className="flex h-full flex-col gap-1.5 p-3">
              <Line className="w-10" />
              <Line className="w-full" muted />
              <Line className="w-4/5" muted />
              <Line className="w-2/3" muted />
            </div>
          </div>

          <FileSheet
            className="absolute left-10 top-10 h-44 w-32 -rotate-6 rounded-3xl bg-white p-3 sm:left-12 sm:h-52 sm:w-36 sm:p-4"
            mark="PDF"
            markClassName="bg-foreground text-background"
          >
            <div className="h-2 w-14 rounded-full bg-primary sm:h-2.5 sm:w-16" />
            <Line className="w-full" muted />
            <Line className="w-5/6" muted />
            <Line className="w-2/3" muted />
            <Line className="w-3/4" muted />
          </FileSheet>

          <span className="absolute left-[52%] top-[48%] z-10 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-foreground shadow-lift sm:size-12 md:size-14">
            <ArrowRightIcon className="size-5 md:size-6" />
          </span>

          <div className="absolute right-0 top-0">
            <FileSheet
              className="h-44 w-32 rotate-7 rounded-3xl bg-white p-3 shadow-lift sm:h-52 sm:w-36 sm:p-4 md:h-56 md:w-40 md:p-5"
              mark="DOCX"
              markClassName="bg-secondary text-foreground"
            >
              <div className="-mx-3 -mt-3 mb-2 h-8 rounded-t-3xl bg-primary sm:-mx-4 sm:-mt-4 sm:mb-3 sm:h-9 md:-mx-5 md:-mt-5 md:h-10" />
              <Line className="w-full" muted />
              <Line className="w-3/4" muted />
              <Line className="w-5/6" muted />
              <Line className="w-1/2" muted />
              <div className="mt-auto flex h-6 items-center gap-1.5 rounded-full bg-muted px-2 sm:h-8 sm:px-2.5">
                <span className="size-1.5 rounded-full bg-foreground/25 sm:size-2" />
                <span className="size-1.5 rounded-full bg-foreground/25 sm:size-2" />
                <span className="size-1.5 rounded-full bg-foreground/25 sm:size-2" />
                <span className="size-1.5 rounded-full bg-foreground/25 sm:size-2" />
              </div>
            </FileSheet>
            <span className="absolute -right-3 -top-3 flex size-12 items-center justify-center rounded-full bg-primary text-foreground shadow-lift sm:-right-4 sm:-top-4 sm:size-14 md:size-16">
              <LockIcon className="size-5 sm:size-6 md:size-7" />
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute left-0 top-0 sm:left-1 sm:top-1"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.12, duration: 0.5 }}
      >
        <Card className="rounded-[22px] px-4 py-3 shadow-lift">
          <CardContent className="p-0">
            <p className="text-xs font-semibold text-muted-foreground">
              {t("weekLabel")}
            </p>
            <p className="text-xl font-extrabold tracking-tight">
              {t("weekValue")}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="absolute right-0 top-2 sm:right-2 sm:top-4 md:right-0"
        initial={{ opacity: 0, y: 14, rotate: 5 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.26, duration: 0.55 }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <CompressCard />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-0 left-0 sm:bottom-2 sm:left-1"
        initial={{ opacity: 0, y: 16, rotate: -4 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.34, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 4.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4,
          }}
        >
          <ProtectCard />
        </motion.div>
      </motion.div>
    </div>
  );
}

function ProtectCard() {
  const t = useTranslations("marketing.overview.overlay.protect");

  return (
    <Card className="w-50 rounded-3xl p-4 shadow-lift sm:w-57.5 sm:p-5">
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

function CompressCard() {
  const t = useTranslations("marketing.overview.overlay.compress");

  return (
    <Card className="w-45 rounded-3xl p-4 shadow-lift sm:w-52.5">
      <CardContent className="p-0">
        <p className="text-xs font-semibold text-muted-foreground">
          {t("title")}
        </p>
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>{t("before")}</span>
          <span>{t("beforeSize")}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: "100%" }}
            whileInView={{ width: "22%" }}
            viewport={{ once: true }}
            transition={{
              duration: 1.1,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.35,
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-sm font-extrabold">
          <span>{t("after")}</span>
          <span>{t("afterSize")}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function FileSheet({
  className,
  mark,
  markClassName,
  children,
}: {
  className?: string;
  mark: string;
  markClassName: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col border border-border shadow-soft",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">{children}</div>
      <span
        className={cn(
          "mt-2 w-fit rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide sm:text-xs",
          markClassName,
        )}
      >
        {mark}
      </span>
    </div>
  );
}

function Line({
  className,
  muted = false,
}: {
  className?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "h-1 rounded-full sm:h-1.5",
        muted ? "bg-muted-foreground/20" : "bg-primary",
        className,
      )}
    />
  );
}
