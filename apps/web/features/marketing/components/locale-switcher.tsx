"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseAppLocale } from "@/lib/i18n/resolve-locale";
import { type AppLocale, routing } from "@/lib/i18n/routing";
import { setAppLocale } from "@/lib/i18n/set-locale";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({
  className,
  size = "default",
}: {
  className?: string;
  size?: "sm" | "default";
}) {
  const t = useTranslations("marketing.footer");
  const router = useRouter();
  const currentLocale = parseAppLocale(useLocale()) ?? routing.defaultLocale;
  const [isPending, startTransition] = useTransition();

  function selectLocale(locale: AppLocale) {
    if (locale === currentLocale || isPending) {
      return;
    }

    startTransition(async () => {
      await setAppLocale(locale);
      router.refresh();
    });
  }

  return (
    <Select
      value={currentLocale}
      disabled={isPending}
      items={routing.locales.map((locale) => ({
        value: locale,
        label: t(`languages.${locale}`),
      }))}
      onValueChange={(value) => {
        if (value === null) {
          return;
        }

        selectLocale(value);
      }}
    >
      <SelectTrigger
        size={size}
        aria-label={t("language")}
        aria-busy={isPending}
        className={cn(size === "sm" ? "w-fit" : "w-full", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        side={size === "sm" ? "top" : "bottom"}
        align="start"
        sideOffset={size === "sm" ? 10 : 6}
        className={size === "sm" ? "min-w-36" : "w-(--anchor-width)"}
      >
        {routing.locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {t(`languages.${locale}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
